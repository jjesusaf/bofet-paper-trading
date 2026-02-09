/**
 * Manual Formspree Test Script
 * 
 * This script actually sends test data to your Formspree form to verify it's working.
 * Run with: bun run test-formspree-manual.ts
 * 
 * WARNING: This will send real test submissions to your Formspree inbox!
 */

async function testFormspreeSubmission() {
  console.log('🧪 Testing Formspree submission to xeeaezdl...\n');

  // Test 1: Source question
  console.log('Test 1: Submitting source answer...');
  const sourceFormData = new FormData();
  sourceFormData.append('question', 'source');
  sourceFormData.append('answer', 'search_engine');
  sourceFormData.append('submitted_at', new Date().toISOString());
  sourceFormData.append('_test', 'true');

  try {
    const sourceResponse = await fetch('https://formspree.io/f/xeeaezdl', {
      method: 'POST',
      body: sourceFormData,
    });

    console.log('✅ Source submission status:', sourceResponse.status);
    console.log('✅ Source submission OK:', sourceResponse.ok);
    
    if (sourceResponse.ok || sourceResponse.status === 302) {
      console.log('✅ Source submission successful! Check your Formspree inbox.\n');
    } else {
      const text = await sourceResponse.text();
      console.log('❌ Source submission failed:', text);
    }
  } catch (error) {
    console.error('❌ Source submission error:', error);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Experience question
  console.log('Test 2: Submitting experience answer...');
  const experienceFormData = new FormData();
  experienceFormData.append('question', 'experience');
  experienceFormData.append('answer', 'beginner');
  experienceFormData.append('submitted_at', new Date().toISOString());
  experienceFormData.append('_test', 'true');

  try {
    const experienceResponse = await fetch('https://formspree.io/f/xeeaezdl', {
      method: 'POST',
      body: experienceFormData,
    });

    console.log('✅ Experience submission status:', experienceResponse.status);
    console.log('✅ Experience submission OK:', experienceResponse.ok);
    
    if (experienceResponse.ok || experienceResponse.status === 302) {
      console.log('✅ Experience submission successful! Check your Formspree inbox.\n');
    } else {
      const text = await experienceResponse.text();
      console.log('❌ Experience submission failed:', text);
    }
  } catch (error) {
    console.error('❌ Experience submission error:', error);
  }

  console.log('\n📧 Check your Formspree inbox at: https://formspree.io/forms/xeeaezdl');
  console.log('Look for submissions with:');
  console.log('  - question: source, answer: search_engine');
  console.log('  - question: experience, answer: beginner');
}

// Run the test
testFormspreeSubmission().catch(console.error);
