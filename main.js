import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';
// Suggested code may be subject to a license. Learn more: ~LicenseLog:992475231.
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

let userdata = localStorage.getItem('profile');
console.log(userdata);
// userdata = decodedResponse.replace(/"/g, " ");


// 🔥🔥 FILL THIS OUT FIRST! 🔥🔥
// Get your Gemini API key by:
// - Selecting "Add Gemini API" in the "Project IDX" panel in the sidebar
// - Or by visiting https://g.co/ai/idxGetGeminiKey
let API_KEY = 'AIzaSyDuPPrRof_WLG6tT0vGbs_uRKjfnTYi2VI';

const tuner = "You are a health and food expert. If the user uploads the pictures of the front and back side of the product, the front side contains advertisements, illustrations an pictures that attract customer's attention (like fresh fruits images on the packaging of fruit juice which leads the user to believe it healthy when in fact it is not and the actual details on the back side of the product are different), the back side contains the actual details of the product. such as nutritional content, ingredients, allergens, and other important details. Your job is to analyze the images and provide the user with the actual details of the product. Give the output in a json format. the json format must contain the following fields: 'product_name', 'product_description', 'product_ingredients', 'product_allergens', 'product_nutritional_content', 'carbohydrates', 'proteins', 'fats', 'sugar', 'is_healthy', 'misleading_information', 'chart'. The json format must be a valid json object use '(singlequote) instead of doublequote in the json response. the is_healthy field must be a boolean value. the misleading_information field must be a boolean value. the product_name, product_description, product_ingredients, product_allergens, product_nutritional_content, carbohydrates, proteins, fats, sugar fields must be a string. the product_name field must be a string. the product_description field must be a string. the product_ingredients field must be a string. the product_allergens field must be a string. the product_nutritional_content field must be a string. the carbohydrates field must be a string. the proteins field must be a string. the fats field must be a string. the sugar field must be a string. the is_healthy field must be a boolean value. the misleading_information field must be a boolean value. the chart must be a doughnut chart object for chart.js which will contain a chart of all the nutrients in the product. Here is the prompt: "

const profileprompt = "Here is the profile of the user: {'diseases': diabetes,'allergies': peanuts,'weight':'50kg'}. Based on the user's profile give suggestion on if this product is good for them or not. also give alternative product recommendations. Give the output in json format. the json must be a valid json object. Here is the format: {'recommended':'boolean', 'alternatives':'string of alternative product names'} . The recommended field must be a boolean value, it tells whether the user can consume the product based on their profile or not. The alternatives field must be a string, which contains the names of alternate products separated by commas."

let initialForm = document.querySelector('#initialForm');
let followupInput = document.querySelector('#followupInput');
let followupButton = document.querySelector('#followupButton');
// let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');
let followupOutputContainer = document.querySelector('.followup-output-container');
let followupOutput = document.querySelector('.followup-output');
let chartContainer = document.querySelector('#chartContainer');
let myChart = document.getElementById('myChart');
let closeButton = document.querySelector('.close-button');
let health = document.querySelector('#health');
let generatingloader = document.getElementById('generatingloader')
let imageBase64_1, imageBase64_2;
let conversation = [];

closeButton.onclick = () => {
  followupOutputContainer.style.display = 'none';
}

initialForm.onsubmit = async (ev) => {
  ev.preventDefault();
  generatingloader.style.display = 'block';

  try {
    const fileInput1 = document.getElementById('fileInput1');
    const fileInput2 = document.getElementById('fileInput2');
    const file1 = fileInput1.files[0];
    const file2 = fileInput2.files[0];

    imageBase64_1 = await fileToBase64(file1);
    imageBase64_2 = await fileToBase64(file2);

    await generateInitialResponse();
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

followupButton.onclick = async () => {
  followupOutputContainer.style.display = 'block';
  if (conversation.length === 0) {
    
    followupOutput.innerHTML = 'Please ask an initial question first.';
    // return;
  }
  
  followupOutput.textContent = 'Generating...';
  await generateFollowupResponse(followupInput.value);
};

let errorcount = 0;
async function generateInitialResponse() {
  
 
  const prompt = tuner;
  let contents = [
    {
      role: 'user',
      parts: [
        { inline_data: { mime_type: 'image/jpeg', data: imageBase64_1 } },
        { inline_data: { mime_type: 'image/jpeg', data: imageBase64_2 } },
        { text: prompt },
        
      ]
    }
  ];

  const encodedResponse = await callGeminiAPI(contents);
  console.log(encodedResponse);
  try {
    // const decodedResponse = decodeURIComponent(encodedResponse);
    const decodedResponse = encodedResponse.slice(33, encodedResponse.length - 14);
    // console.log(decodedResponse);
    const newString = decodedResponse.replace(/'/g, '"');
    const jsonObj = JSON.parse(newString);
    generatingloader.style.display = 'none';
    // // const jsonResponse = JSON.parse(response.match(/\{(.*)\}/)[0]);
    console.log(jsonObj);
    let tableHtml = '<table border="1"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
    
    for (const [key, value] of Object.entries(jsonObj)) {
      tableHtml += `<tr><td>${key}</td><td>${value}</td></tr>`;
    }
    if (jsonObj.is_healthy) {
      health.classList.add('ishealthy');
      health.innerHTML = '<p>Healthy</p>';
      health.style.display = 'block';
    } else {
      health.classList.add('isunhealthy');
      health.innerHTML = '<p>Unhealthy</p>';
      health.style.display = 'block';
    }
    
    tableHtml += '</tbody></table>';
    output.innerHTML = tableHtml;


    const chartOptions = {
      
    }

    new Chart(myChart, {
      type: 'doughnut',
      data: {
        labels: jsonObj.chart.data.labels,
        datasets: jsonObj.chart.data.datasets
      },
      options: {
        
      }
    })
    chartContainer.style.display = 'block';
    errorcount = 0;
    
  } catch (error) {
    if(errorcount>2){
      output.innerHTML = `Error parsing JSON: ${error.message}<br>Raw response: ${encodedResponse}`;
      errorcount = 0;
    }
    else{
      errorcount = errorcount+1;
      generateInitialResponse();
    }
  }
  // output.innerHTML = response;
  conversation = contents.concat([{ role: 'model', parts: [{ text: encodedResponse }] }]);
  generateProfileResponse(profileprompt);
}


async function generateFollowupResponse(prompt) {
  // prompt = tuner + prompt;
  conversation.push({ role: 'user', parts: [{ text: prompt }] });

  const response = await callGeminiAPI(conversation);
  followupOutput.style.display = 'block';
  followupOutput.innerHTML = response;
  conversation.push({ role: 'model', parts: [{ text: response }] });
}

async function generateProfileResponse(prompt) {
  console.log(conversation);
  conversation.push({ role: 'user', parts: [{ text: prompt }] });

  const response = await callGeminiAPI(conversation);
  console.log(response);
  conversation.push({ role: 'model', parts: [{ text: response }] });

}

async function callGeminiAPI(contents) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
  });

  const result = await model.generateContentStream({ contents });

  let buffer = [];
  let md = new MarkdownIt();
  for await (let response of result.stream) {
    buffer.push(response.text());
  }
  return md.render(buffer.join(''));
}

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
  });
}

// You can delete this once you've filled out an API key
maybeShowApiKeyBanner(API_KEY);