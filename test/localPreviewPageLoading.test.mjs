import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

test('local preview loads Home and Team Members without a Veeva runtime', async () => {
  const result = await build({
    stdin: {
      contents: `
        export { loadHome } from '@/lib/dataservice/accountPlan/home';
        export { loadTeamMembers } from '@/lib/dataservice/accountPlan/teamMembers';
      `,
      resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    },
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
    define: { 'import.meta.env': JSON.stringify({ DEV: true, MODE: 'development' }) },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
  });
  const { loadHome, loadTeamMembers } = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
  );
  const home = await loadHome();
  const team = await loadTeamMembers();
  assert.ok(home.barriers.length > 0);
  assert.ok(home.drivers.length > 0);
  assert.ok(home.teamMembers.length > 0);
  assert.deepEqual(team.teamMembers, home.teamMembers);
  assert.ok(team.teamMembers.every((member) => member.id && member.name));
});
