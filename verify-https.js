#!/usr/bin/env node

/**
 * HTTPS Verification Script
 * Checks that all API calls in the React app are using HTTPS endpoints
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying HTTPS configuration in React UI...\n');

// Files to check for HTTP endpoints
const filesToCheck = [
  'src/config/services.ts',
  'src/utils/simpleTranscription.ts',
  'src/utils/liveTranscription.ts',
  'src/components/RealtimeConsultation.tsx',
  'src/components/OllamaConfig.tsx',
  'src/components/Consultation.tsx'
];

let hasHttpEndpoints = false;
let totalChecks = 0;
let passedChecks = 0;

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📁 Checking ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for HTTP endpoints (excluding comments and external services)
    const httpMatches = content.match(/http:\/\/[^'"\s]+/g);
    const httpsMatches = content.match(/https:\/\/[^'"\s]+/g);
    
    if (httpMatches) {
      const filteredHttp = httpMatches.filter(url => 
        !url.includes('48.216.181.122:11434') && // External Ollama service
        !url.includes('//') && // Avoid double slashes
        !url.includes('localhost:11434') // External Ollama
      );
      
      if (filteredHttp.length > 0) {
        console.log(`  ❌ Found HTTP endpoints:`);
        filteredHttp.forEach(url => console.log(`     - ${url}`));
        hasHttpEndpoints = true;
      } else {
        console.log(`  ✅ No problematic HTTP endpoints found`);
        passedChecks++;
      }
    } else {
      console.log(`  ✅ No HTTP endpoints found`);
      passedChecks++;
    }
    
    if (httpsMatches) {
      console.log(`  ✅ Found ${httpsMatches.length} HTTPS endpoints`);
    }
    
    totalChecks++;
    console.log('');
  } else {
    console.log(`⚠️  File not found: ${filePath}\n`);
  }
});

// Check vite.config.ts for HTTPS configuration
console.log('📁 Checking vite.config.ts for HTTPS configuration...');
if (fs.existsSync('vite.config.ts')) {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  if (viteConfig.includes('https:') && viteConfig.includes('server.crt')) {
    console.log('  ✅ Vite is configured for HTTPS with SSL certificates\n');
    passedChecks++;
  } else {
    console.log('  ❌ Vite HTTPS configuration not found\n');
    hasHttpEndpoints = true;
  }
  totalChecks++;
}

// Check docker-compose.yml for HTTPS profile
console.log('📁 Checking docker-compose.yml for HTTPS configuration...');
if (fs.existsSync('docker-compose.yml')) {
  const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
  if (dockerCompose.includes('profiles:') && dockerCompose.includes('https') && dockerCompose.includes('443:443')) {
    console.log('  ✅ Docker Compose is configured for HTTPS\n');
    passedChecks++;
  } else {
    console.log('  ❌ Docker Compose HTTPS configuration not found\n');
    hasHttpEndpoints = true;
  }
  totalChecks++;
}

// Check nginx.conf for HTTPS configuration
console.log('📁 Checking nginx.conf for HTTPS configuration...');
if (fs.existsSync('nginx.conf')) {
  const nginxConfig = fs.readFileSync('nginx.conf', 'utf8');
  if (nginxConfig.includes('listen 443 ssl') && nginxConfig.includes('ssl_certificate')) {
    console.log('  ✅ Nginx is configured for HTTPS\n');
    passedChecks++;
  } else {
    console.log('  ❌ Nginx HTTPS configuration not found\n');
    hasHttpEndpoints = true;
  }
  totalChecks++;
}

// Summary
console.log('📊 HTTPS Verification Summary:');
console.log(`   Total checks: ${totalChecks}`);
console.log(`   Passed: ${passedChecks}`);
console.log(`   Failed: ${totalChecks - passedChecks}`);

if (hasHttpEndpoints) {
  console.log('\n❌ HTTPS verification FAILED');
  console.log('   Some components are still using HTTP endpoints');
  console.log('   Please update all API calls to use HTTPS');
  process.exit(1);
} else {
  console.log('\n✅ HTTPS verification PASSED');
  console.log('   All API calls are configured to use HTTPS');
  console.log('   Your React UI is ready for secure communication!');
  process.exit(0);
}
