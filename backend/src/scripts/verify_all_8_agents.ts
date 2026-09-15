import { execSync } from 'child_process';
import * as path from 'path';

const agents = [
  { name: 'Valentina', script: 'verify_valentina_training.ts', area: 'Laboral' },
  { name: 'Sebastián', script: 'verify_sebastian_training.ts', area: 'Penal' },
  { name: 'Diego', script: 'verify_diego_training.ts', area: 'Civil' },
  { name: 'Adriana', script: 'verify_adriana_training.ts', area: 'Corporativo & M&A' },
  { name: 'Rodrigo', script: 'verify_rodrigo_training.ts', area: 'Minero & Ambiental' },
  { name: 'Camila', script: 'verify_camila_training.ts', area: 'Familia' },
  { name: 'Fernanda', script: 'verify_fernanda_training.ts', area: 'Tributario' },
  { name: 'Marco', script: 'verify_marco_training.ts', area: 'Administrativo & OECE' },
];

console.log('════════════════════════════════════════════════════════════════');
console.log(' AUDITORÍA GENERAL DE LOS 8 ESPECIALISTAS LEGALES DE HARDMAN ');
console.log('════════════════════════════════════════════════════════════════\n');

let allSuccess = true;
const results: Array<{ name: string; area: string; status: string; testsPassed?: string }> = [];

for (const agent of agents) {
  const scriptPath = path.join(__dirname, agent.script);
  try {
    const stdout = execSync(`npx tsx "${scriptPath}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const match = stdout.match(/Resultado final:\s*(\d+\s*\/\s*\d+)\s*pruebas/i);
    const score = match ? match[1] : 'OK';
    results.push({ name: agent.name, area: agent.area, status: '✅ 100% PASS', testsPassed: score });
    console.log(`[PASS] ${agent.name.padEnd(12)} (${agent.area.padEnd(22)}): ${score} pruebas superadas`);
  } catch (err: any) {
    allSuccess = false;
    results.push({ name: agent.name, area: agent.area, status: '❌ FAIL', testsPassed: 'ERROR' });
    console.error(`[FAIL] ${agent.name} (${agent.area}): Error ejecutando suite`);
    if (err.stdout) console.error(err.stdout);
  }
}

console.log('\n════════════════════════════════════════════════════════════════');
console.log(` VEREDICTO FINAL: ${allSuccess ? '8 DE 8 ESPECIALISTAS OPERATIVOS AL 100%' : 'FALLOS DETECTADOS'}`);
console.log('════════════════════════════════════════════════════════════════');

if (!allSuccess) {
  process.exitCode = 1;
}
