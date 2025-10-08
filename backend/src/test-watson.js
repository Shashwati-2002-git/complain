// Create an ESM version of the test file// ESM version of the test script// Load environment variables// Load environment variables// Load environment variables

import dotenv from 'dotenv';

dotenv.config();// test-watson.js - This is an ES module



// Import using dynamic importimport dotenv from "dotenv";

const testWatsonConnection = async () => {

  try {// Load environment variables

    console.log('Watson Configuration Debug:');

    console.log('- API Key:', process.env.WATSON_API_KEY ? import dotenv from "dotenv";dotenv.config();import dotenv from "dotenv";import dotenv from "dotenv";

      `${process.env.WATSON_API_KEY.substring(0, 5)}...${process.env.WATSON_API_KEY.substring(process.env.WATSON_API_KEY.length - 5)}` : 

      'MISSING');dotenv.config();

    console.log('- Region:', process.env.WATSON_REGION || 'Not set (using default)');

    console.log('- Service Instance ID:', process.env.WATSON_SERVICE_INSTANCE_ID || 'MISSING');

    console.log('- Assistant ID:', process.env.WATSON_ASSISTANT_ID || 'MISSING');

    console.log('- Skill ID:', process.env.WATSON_SKILL_ID || 'MISSING');console.log('Watson Configuration Debug:');

    console.log('- Draft Environment ID:', process.env.WATSON_DRAFT_ENVIRONMENT_ID || 'MISSING');

    console.log('- Live Environment ID:', process.env.WATSON_LIVE_ENVIRONMENT_ID || 'MISSING');console.log('- API Key:', process.env.WATSON_API_KEY ? console.log('Watson Configuration Debug:');dotenv.config();dotenv.config();

  

    // Test the API directly with fetch  `${process.env.WATSON_API_KEY.substring(0, 5)}...${process.env.WATSON_API_KEY.substring(process.env.WATSON_API_KEY.length - 5)}` : 

    console.log('Testing Watson API directly with fetch...');

      'MISSING');console.log('- API Key:', process.env.WATSON_API_KEY ? 

    // Initialize Watson Assistant

    const region = process.env.WATSON_REGION || 'au-syd';console.log('- Region:', process.env.WATSON_REGION || 'Not set (using default)');

    const serviceUrl = `https://api.${region}.assistant.watson.cloud.ibm.com/instances/${process.env.WATSON_SERVICE_INSTANCE_ID}/v2`;

    console.log('- Service URL:', serviceUrl);console.log('- Service Instance ID:', process.env.WATSON_SERVICE_INSTANCE_ID || 'MISSING');  `${process.env.WATSON_API_KEY.substring(0, 5)}...${process.env.WATSON_API_KEY.substring(process.env.WATSON_API_KEY.length - 5)}` : 

    

    // Create a basic auth token from the API keyconsole.log('- Assistant ID:', process.env.WATSON_ASSISTANT_ID || 'MISSING');

    const apiKey = process.env.WATSON_API_KEY;

    if (!apiKey) {console.log('- Skill ID:', process.env.WATSON_SKILL_ID || 'MISSING');  'MISSING');

      throw new Error('Watson API key is missing');

    }console.log('- Draft Environment ID:', process.env.WATSON_DRAFT_ENVIRONMENT_ID || 'MISSING');

    

    const authString = Buffer.from(`apikey:${apiKey}`).toString('base64');console.log('- Live Environment ID:', process.env.WATSON_LIVE_ENVIRONMENT_ID || 'MISSING');console.log('- Region:', process.env.WATSON_REGION || 'Not set (using default)');console.log('Watson Configuration Debug:');// Use dynamic import for watson (using import() function)

    

    // Make a request to list assistants (a simple API call to test connectivity)

    const url = `${serviceUrl}/assistants?version=2023-06-15`;

    console.log(`Sending request to: ${url}`);// Initialize Watson Assistantconsole.log('- Service Instance ID:', process.env.WATSON_SERVICE_INSTANCE_ID || 'MISSING');

    

    const response = await fetch(url, {const region = process.env.WATSON_REGION || 'au-syd';

      method: 'GET',

      headers: {const serviceUrl = `https://api.${region}.assistant.watson.cloud.ibm.com/instances/${process.env.WATSON_SERVICE_INSTANCE_ID}/v2`;console.log('- Assistant ID:', process.env.WATSON_ASSISTANT_ID || 'MISSING');console.log('- API Key:', process.env.WATSON_API_KEY ? try {

        'Authorization': `Basic ${authString}`,

        'Content-Type': 'application/json'

      }

    });console.log('- Service URL:', serviceUrl);console.log('- Skill ID:', process.env.WATSON_SKILL_ID || 'MISSING');

    

    if (!response.ok) {

      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);

    }// Simply check if the environment variables are properly setconsole.log('- Draft Environment ID:', process.env.WATSON_DRAFT_ENVIRONMENT_ID || 'MISSING');  `${process.env.WATSON_API_KEY.substring(0, 5)}...${process.env.WATSON_API_KEY.substring(process.env.WATSON_API_KEY.length - 5)}` :   const AssistantV2Promise = import('ibm-watson/assistant/v2.js').then(module => module.default);

    

    const data = await response.json();const isConfigured = 

    console.log('✅ Successfully connected to Watson API!');

    console.log('Available assistants:', data);  process.env.WATSON_API_KEY && console.log('- Live Environment ID:', process.env.WATSON_LIVE_ENVIRONMENT_ID || 'MISSING');

    

    return data;  process.env.WATSON_SERVICE_INSTANCE_ID && 

  } catch (error) {

    console.error('❌ Error connecting to Watson API:', error);  process.env.WATSON_ASSISTANT_ID;  'MISSING');  const IamAuthenticatorPromise = import('ibm-watson/auth/index.js').then(module => module.IamAuthenticator);

    return null;

  }

};

if (isConfigured) {// Initialize Watson Assistant

// Run the test

testWatsonConnection();  console.log('✅ Watson environment variables are properly configured.');

  console.log('The IBM Watson Assistant integration should work correctly.');const region = process.env.WATSON_REGION || 'au-syd';console.log('- Region:', process.env.WATSON_REGION || 'Not set (using default)');

  console.log('');

  console.log('For full testing with the actual API, please run:');const serviceUrl = `https://api.${region}.assistant.watson.cloud.ibm.com/instances/${process.env.WATSON_SERVICE_INSTANCE_ID}/v2`;

  console.log('node src/test-watson-cjs.js');

} else {console.log('- Service Instance ID:', process.env.WATSON_SERVICE_INSTANCE_ID || 'MISSING');  const [AssistantV2, IamAuthenticator] = await Promise.all([

  console.error('❌ Watson environment variables are NOT properly configured.');

  console.error('Please check your .env file and make sure all required variables are set.');console.log('- Service URL:', serviceUrl);

  process.exit(1);

}console.log('- Assistant ID:', process.env.WATSON_ASSISTANT_ID || 'MISSING');    AssistantV2Promise,

async function testWatson() {

  try {console.log('- Skill ID:', process.env.WATSON_SKILL_ID || 'MISSING');    IamAuthenticatorPromise

    const { default: AssistantV2 } = await import('ibm-watson/assistant/v2.js');

    const { IamAuthenticator } = await import('ibm-watson/auth/index.js');console.log('- Draft Environment ID:', process.env.WATSON_DRAFT_ENVIRONMENT_ID || 'MISSING');  ]);

    

    console.log('✅ Watson modules imported successfully');console.log('- Live Environment ID:', process.env.WATSON_LIVE_ENVIRONMENT_ID || 'MISSING');

    

    const watsonAssistant = new AssistantV2({// Log Watson configuration

      version: '2023-06-15',

      authenticator: new IamAuthenticator({// Initialize Watson Assistantconsole.log('Watson Configuration Debug:');

        apikey: process.env.WATSON_API_KEY,

      }),const region = process.env.WATSON_REGION || 'au-syd';console.log('- API Key:', process.env.WATSON_API_KEY ? 

      serviceUrl: serviceUrl,

      disableSslVerification: false,const serviceUrl = `https://api.${region}.assistant.watson.cloud.ibm.com/instances/${process.env.WATSON_SERVICE_INSTANCE_ID}/v2`;  `${process.env.WATSON_API_KEY.substring(0, 5)}...${process.env.WATSON_API_KEY.substring(process.env.WATSON_API_KEY.length - 5)}` : 

    });

      'MISSING');

    console.log('✅ Watson Assistant initialized successfully');

    console.log('- Service URL:', serviceUrl);console.log('- Region:', process.env.WATSON_REGION || 'Not set (using default)');

    // Test creating a session

    console.log(`Creating new Watson session with assistant ${process.env.WATSON_ASSISTANT_ID}...`);console.log('- Service Instance ID:', process.env.WATSON_SERVICE_INSTANCE_ID || 'MISSING');

    

    const response = await watsonAssistant.createSession({async function testWatson() {console.log('- Assistant ID:', process.env.WATSON_ASSISTANT_ID || 'MISSING');

      assistantId: process.env.WATSON_ASSISTANT_ID,

    });  try {console.log('- Skill ID:', process.env.WATSON_SKILL_ID || 'MISSING');

    

    if (!response || !response.result || !response.result.session_id) {    const { default: AssistantV2 } = await import('ibm-watson/assistant/v2.js');console.log('- Draft Environment ID:', process.env.WATSON_DRAFT_ENVIRONMENT_ID || 'MISSING');

      console.error('❌ Invalid response from Watson createSession:', response);

      process.exit(1);    const { IamAuthenticator } = await import('ibm-watson/auth/index.js');console.log('- Live Environment ID:', process.env.WATSON_LIVE_ENVIRONMENT_ID || 'MISSING');

    }

        

    const sessionId = response.result.session_id;

    console.log(`✅ Watson session created successfully: ${sessionId.substring(0, 8)}...`);    console.log('✅ Watson modules imported successfully');// Initialize Watson Assistant

    

    // Test sending a message    const region = process.env.WATSON_REGION || 'au-syd';

    console.log('Sending test message to Watson...');

    const messageResponse = await watsonAssistant.message({    const watsonAssistant = new AssistantV2({const serviceUrl = `https://api.${region}.assistant.watson.cloud.ibm.com/instances/${process.env.WATSON_SERVICE_INSTANCE_ID}/v2`;

      assistantId: process.env.WATSON_ASSISTANT_ID,

      sessionId: sessionId,      version: '2023-06-15',

      input: {

        message_type: 'text',      authenticator: new IamAuthenticator({console.log('- Service URL:', serviceUrl);

        text: 'Hello, how can you help me?',

        options: {        apikey: process.env.WATSON_API_KEY,

          return_context: true,

        },      }),try {

      },

      context: {      serviceUrl: serviceUrl,  const watsonAssistant = new watson.AssistantV2({

        user_info: {

          id: 'test-user',      disableSslVerification: false,    version: '2023-06-15',

          name: 'Test User',

          email: 'test@example.com',    });    authenticator: new IamAuthenticator({

          role: 'user'

        }          apikey: process.env.WATSON_API_KEY,

      },

    });    console.log('✅ Watson Assistant initialized successfully');    }),



    console.log('✅ Message sent successfully');        serviceUrl: serviceUrl,

    console.log('Watson response:');

    const watsonResponse = messageResponse.result.output.generic;    // Test creating a session    disableSslVerification: false,

    console.log(watsonResponse.map(msg => msg.text).join(' '));

        console.log(`Creating new Watson session with assistant ${process.env.WATSON_ASSISTANT_ID}...`);  });

    // Clean up the session

    await watsonAssistant.deleteSession({      console.log('✅ Watson Assistant initialized successfully');

      assistantId: process.env.WATSON_ASSISTANT_ID,

      sessionId: sessionId,    const response = await watsonAssistant.createSession({

    });

    console.log('✅ Watson session deleted successfully');      assistantId: process.env.WATSON_ASSISTANT_ID,  // Test creating a session

    

  } catch (error) {    });  console.log(`Creating new Watson session with assistant ${process.env.WATSON_ASSISTANT_ID}...`);

    console.error('❌ Error with Watson Assistant:', error);

    if (error.body) {      

      try {

        const errorDetails = JSON.parse(error.body);    if (!response || !response.result || !response.result.session_id) {  const response = await watsonAssistant.createSession({

        console.error('Watson error details:', errorDetails);

      } catch (e) {      console.error('❌ Invalid response from Watson createSession:', response);    assistantId: process.env.WATSON_ASSISTANT_ID,

        console.error('Watson error body (raw):', error.body);

      }      process.exit(1);  });

    }

    process.exit(1);    }  

  }

}      if (!response || !response.result || !response.result.session_id) {



testWatson();    const sessionId = response.result.session_id;    console.error('❌ Invalid response from Watson createSession:', response);

    console.log(`✅ Watson session created successfully: ${sessionId.substring(0, 8)}...`);    process.exit(1);

      }

    // Test sending a message  

    console.log('Sending test message to Watson...');  const sessionId = response.result.session_id;

    const messageResponse = await watsonAssistant.message({  console.log(`✅ Watson session created successfully: ${sessionId.substring(0, 8)}...`);

      assistantId: process.env.WATSON_ASSISTANT_ID,  

      sessionId: sessionId,  // Test sending a message

      input: {  console.log('Sending test message to Watson...');

        message_type: 'text',  const messageResponse = await watsonAssistant.message({

        text: 'Hello, how can you help me?',    assistantId: process.env.WATSON_ASSISTANT_ID,

        options: {    sessionId: sessionId,

          return_context: true,    input: {

        },      message_type: 'text',

      },      text: 'Hello, how can you help me?',

      context: {      options: {

        user_info: {        return_context: true,

          id: 'test-user',      },

          name: 'Test User',    },

          email: 'test@example.com',    context: {

          role: 'user'      user_info: {

        }        id: 'test-user',

      },        name: 'Test User',

    });        email: 'test@example.com',

        role: 'user'

    console.log('✅ Message sent successfully');      }

    console.log('Watson response:');    },

    const watsonResponse = messageResponse.result.output.generic;  });

    console.log(watsonResponse.map(msg => msg.text).join(' '));

      console.log('✅ Message sent successfully');

    // Clean up the session  console.log('Watson response:');

    await watsonAssistant.deleteSession({  const watsonResponse = messageResponse.result.output.generic;

      assistantId: process.env.WATSON_ASSISTANT_ID,  console.log(watsonResponse.map(msg => msg.text).join(' '));

      sessionId: sessionId,  

    });  // Clean up the session

    console.log('✅ Watson session deleted successfully');  await watsonAssistant.deleteSession({

        assistantId: process.env.WATSON_ASSISTANT_ID,

  } catch (error) {    sessionId: sessionId,

    console.error('❌ Error with Watson Assistant:', error);  });

    if (error.body) {  console.log('✅ Watson session deleted successfully');

      try {  

        const errorDetails = JSON.parse(error.body);} catch (error) {

        console.error('Watson error details:', errorDetails);  console.error('❌ Error with Watson Assistant:', error);

      } catch (e) {  if (error.body) {

        console.error('Watson error body (raw):', error.body);    try {

      }      const errorDetails = JSON.parse(error.body);

    }      console.error('Watson error details:', errorDetails);

    process.exit(1);    } catch (e) {

  }      console.error('Watson error body (raw):', error.body);

}    }

  }

testWatson();  process.exit(1);
}