#!/usr/bin/env node

/**
 * Security Validation Script
 * Runs various security checks on the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Starting Security Validation...\n');

// Security patterns to check
const SECURITY_PATTERNS = [
  /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /token\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /api[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /akia[a-z0-9]{16}/gi,
  /sk-[a-zA-Z0-9]{48}/gi,
  /ghp_[a-zA-Z0-9]{36}/gi,
  /gho_[a-zA-Z0-9]{36}/gi,
  /ghu_[a-zA-Z0-9]{36}/gi,
  /ghs_[a-zA-Z0-9]{36}/gi,
  /ghr_[a-zA-Z0-9]{36}/gi
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.ts', '.json', '.env', '.env.example', '.config', '.yml', '.yaml'];

function findFiles(dir, extensions) {
  let results = [];
  
  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git
        if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
          traverse(filePath);
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  
  traverse(dir);
  return results;
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    for (const pattern of SECURITY_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(...matches);
      }
    }
    
    return issues;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return [];
  }
}

function checkSensitiveFiles() {
  const sensitivePatterns = [
    '*.pem',
    '*.key',
    '*.p12',
    '.env',
    'id_rsa*',
    '*.pfx',
    '*.cer'
  ];
  
  const foundFiles = [];
  
  for (const pattern of sensitivePatterns) {
    try {
      const result = execSync(`find . -name "${pattern}" -type f`, { encoding: 'utf8' });
      if (result.trim()) {
        foundFiles.push(...result.trim().split('\n'));
      }
    } catch (error) {
      // No files found, which is good
    }
  }
  
  return foundFiles;
}

function checkPackageSecurity() {
  try {
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const vulnerablePackages = [];
      
      for (const [name, version] of Object.entries(deps)) {
        // Check for known vulnerable packages (simplified check)
        if (name.includes('jsonwebtoken') && version.startsWith('8.')) {
          vulnerablePackages.push({ name, version, issue: 'Potential JWT security issues' });
        }
        if (name.includes('lodash') && version.startsWith('4.')) {
          vulnerablePackages.push({ name, version, issue: 'Lodash prototype pollution' });
        }
      }
      
      return vulnerablePackages;
    }
  } catch (error) {
    console.error('Error checking package security:', error.message);
  }
  
  return [];
}

function main() {
  const files = findFiles('.', SCAN_EXTENSIONS);
  let totalIssues = 0;
  const fileResults = [];
  
  console.log(`📁 Scanning ${files.length} files...\n`);
  
  for (const file of files) {
    const issues = scanFile(file);
    if (issues.length > 0) {
      fileResults.push({ file, issues });
      totalIssues += issues.length;
      console.log(`⚠️  ${file}: ${issues.length} issues found`);
      issues.forEach(issue => {
        console.log(`   - ${issue.substring(0, 100)}...`);
      });
    }
  }
  
  console.log('\n🔍 Checking for sensitive files...');
  const sensitiveFiles = checkSensitiveFiles();
  if (sensitiveFiles.length > 0) {
    console.log(`⚠️  Found ${sensitiveFiles.length} sensitive files:`);
    sensitiveFiles.forEach(file => console.log(`   - ${file}`));
    totalIssues += sensitiveFiles.length;
  } else {
    console.log('✅ No sensitive files found');
  }
  
  console.log('\n📦 Checking package security...');
  const vulnerablePackages = checkPackageSecurity();
  if (vulnerablePackages.length > 0) {
    console.log(`⚠️  Found ${vulnerablePackages.length} potentially vulnerable packages:`);
    vulnerablePackages.forEach(pkg => {
      console.log(`   - ${pkg.name}@${pkg.version}: ${pkg.issue}`);
    });
    totalIssues += vulnerablePackages.length;
  } else {
    console.log('✅ No obvious package security issues found');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Security Scan Summary:`);
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Issues found: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('✅ Security scan passed! No issues detected.');
    process.exit(0);
  } else {
    console.log(`❌ Security scan failed! ${totalIssues} issues detected.`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}