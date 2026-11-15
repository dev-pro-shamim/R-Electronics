const fs = require('fs');
const path = require('path');

// Helper to sanitize text
function cleanText(txt) {
  if (!txt) return '';
  return String(txt).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Subcategory classifier
function classifyAcSubcategory(title, specsText = '') {
  const combined = (title + ' ' + specsText).toLowerCase();
  if (combined.includes('cassette')) return 'cassette-ac';
  if (combined.includes('ceiling')) return 'ceiling-ac';
  if (combined.includes('portable') || combined.includes('floor stand')) return 'portable-ac';
  if (combined.includes('2.5 ton') || combined.includes('2.5ton')) return '2-5-ton-ac';
  if (combined.includes('2 ton') || combined.includes('2.0 ton') || combined.includes('24000') || combined.includes('24k') || combined.includes('hsu-24') || combined.includes('gs-24') || combined.includes('2.0ton')) return '2-ton-ac';
  if (combined.includes('1.5 ton') || combined.includes('18000') || combined.includes('18k') || combined.includes('hsu-18') || combined.includes('gs-18') || combined.includes('1.5ton')) return '1-5-ton-ac';
  if (combined.includes('1 ton') || combined.includes('1.0 ton') || combined.includes('12000') || combined.includes('12k') || combined.includes('hsu-12') || combined.includes('hsu-13') || combined.includes('gs-12') || combined.includes('1.0ton')) return '1-ton-ac';
  return '1-5-ton-ac';
}

console.log('Helper loaded');
