import { execSync } from 'node:child_process';

console.log('🔍 Ejecutando auditoría de aseguramiento de calidad y balance (QA)...');
try {
  execSync('node scripts/test_simulation.js', { encoding: 'utf8', stdio: 'inherit' });
  console.log('✅ Verificación de balance y robustez completada con éxito.');
} catch (err) {
  console.error('❌ Falló la auditoría de balance.');
  process.exit(1);
}
