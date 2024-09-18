// Import the necessary modules
const express = require('express');   // Framework to create the web server
const xml2js = require('xml2js');     // Library to convert XML to JSON

// Create an instance of the Express application
const app = express();

// Define the port where the server will listen
const port = process.env.PORT || 3000;

// Global variables for the cache
let cachedXmlData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const MAX_CACHE_AGE = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

// Define the main route to handle GET requests to '/convert'
app.get('/convert', async (req, res) => {
  // Define an array with the supported currency codes
  const currencies = [
    'USD', // United States Dollar
    'JPY', // Japanese Yen
    'BGN', // Bulgarian Lev
    'CZK', // Czech Koruna
    'DKK', // Danish Krone
    'GBP', // British Pound Sterling
    'HUF', // Hungarian Forint
    'PLN', // Polish Zloty
    'RON', // Romanian Leu
    'SEK', // Swedish Krona
    'CHF', // Swiss Franc
    'ISK', // Icelandic Króna
    'NOK', // Norwegian Krone
    'TRY', // Turkish Lira
    'AUD', // Australian Dollar
    'BRL', // Brazilian Real
    'CAD', // Canadian Dollar
    'CNY', // Chinese Yuan Renminbi
    'HKD', // Hong Kong Dollar
    'IDR', // Indonesian Rupiah
    'ILS', // Israeli New Shekel
    'INR', // Indian Rupee
    'KRW', // South Korean Won
    'MXN', // Mexican Peso
    'MYR', // Malaysian Ringgit
    'NZD', // New Zealand Dollar
    'PHP', // Philippine Peso
    'SGD', // Singapore Dollar
    'THB', // Thai Baht
    'ZAR', // South African Rand
    'EUR'  // Euro
  ];

  // Get the request parameters (query parameters)
  const fromCurrency = req.query.from_currency || 'USD';   // Source currency, default 'USD'
  const toCurrencies = req.query.to_currency               // Destination currencies, separated by commas
    ? req.query.to_currency.split(',')                     // If defined, split the string into an array
    : currencies;                                          // If not, use all supported currencies
  const amount = parseFloat(req.query.amount) || 1;        // Amount to convert, default 1

  try {
    // Declare the variable we will use to store the XML data
    let xmlData;
    // Declare a variable to indicate if we should use the cache
    let useCache = false;

    // Check if the XML is in cache and has not expired
    if (cachedXmlData && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      // Use the cached XML
      xmlData = cachedXmlData;
    } else {
      // Try to obtain the XML with up to 3 attempts
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;

      while (attempts < maxAttempts && !success) {
        try {
          // Make a GET request to the European Central Bank to obtain the exchange rates in XML format
          // The response contains the reference exchange rates for the Euro (EUR) with respect to other currencies
          // The ECB API URL is: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
          const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');

          // Verify that the response is successful
          if (!response.ok) {
            throw new Error(`Error obtaining data from the ECB: ${response.statusText}`);
          }

          // Read the content of the response as text (the XML)
          xmlData = await response.text();

          // Update the cache
          cachedXmlData = xmlData;
          cacheTimestamp = Date.now();
          success = true;
        } catch (error) {
          // If an error occurs, increment the number of attempts
          attempts++;

          if (attempts === maxAttempts) {
            // If we reach the maximum number of attempts, check if there is a valid cache
            if (cachedXmlData && (Date.now() - cacheTimestamp) < MAX_CACHE_AGE) {
              xmlData = cachedXmlData;
              useCache = true;
            } else {
              // No valid cache, throw the error
              throw new Error('Could not obtain the XML from the ECB and no cached data is available.');
            }
          } else {
            // Wait a short time before retrying
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
          }
        }
      }
    }

    // Use xml2js to convert the XML into a JavaScript object
    const result = await xml2js.parseStringPromise(xmlData);

    // Navigate through the resulting object to access the exchange rates
    const cubes = result['gesmes:Envelope'].Cube[0].Cube[0].Cube;

    // Create a dictionary (object) to store the exchange rates
    const rates = { 'EUR': 1.0 }; // Add the Euro with a rate of 1.0, since it is the reference

    // Iterate over each 'Cube' in 'cubes' to extract the exchange rates
    cubes.forEach(cube => {
      const currency = cube.$.currency;        // Get the currency code (attribute 'currency')
      const rate = parseFloat(cube.$.rate);    // Get the exchange rate (attribute 'rate') and convert it to a number
      rates[currency] = rate;                  // Add the currency and its rate to the 'rates' dictionary
    });

    // Define a function to calculate the cross exchange rate
    const getExchangeRate = (from, to) => {
      // Check that both currencies exist in the 'rates' dictionary
      if (!rates[from] || !rates[to]) {
        // If one does not exist, throw an error with a descriptive message
        throw new Error(`One of the currencies (${from} or ${to}) is not available in the ECB data.`);
      }
      // Calculate the cross exchange rate by dividing the rate of the destination currency by that of the source currency
      return rates[to] / rates[from];
    };

    // Function to format the date in European format 'DD/MM/YYYY'
    const formatEuropeanDate = (isoDate) => {
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    };

    // Get the date of the exchange rate and format it
    const isoDate = result['gesmes:Envelope'].Cube[0].Cube[0].$.time;
    let formattedDate = formatEuropeanDate(isoDate);

    // If we are using an emergency cache, indicate that the date may be outdated
    if (useCache) {
      formattedDate += ' (Outdated data)';
    }

    // Prepare an array to store the conversions
    const conversions = toCurrencies.map(toCurrency => {
      // For each destination currency, calculate the exchange rate and the converted amount
      const exchangeRate = getExchangeRate(fromCurrency, toCurrency);  // Exchange rate between the source and destination currency
      const convertedAmount = amount * exchangeRate;                   // Calculate the converted amount

      // Round the values upwards to two decimals
      const roundedExchangeRate = Math.ceil(exchangeRate * 100) / 100;
      const roundedConvertedAmount = Math.ceil(convertedAmount * 100) / 100;

      // Return an object with the details of the conversion
      return {
        to_currency: toCurrency,                      // Destination currency
        exchange_rate: roundedExchangeRate,           // Exchange rate rounded to two decimals
        converted_amount: roundedConvertedAmount      // Converted amount rounded to two decimals
      };
    });

    // Respond to the request with a JSON object containing the results
    res.json({
      from_currency: fromCurrency,       // Source currency
      amount: amount,                    // Original amount to convert
      date: formattedDate,               // Date in European format 'DD/MM/YYYY'
      conversions: conversions           // Array with the conversions to each destination currency
    });
  } catch (error) {
    // If any error occurs in the process, we catch and handle it here
    console.error(error);                          // Print the error to the console for debugging purposes
    res.status(500).json({ error: error.message }); // Respond with an HTTP 500 code and an error message
  }
});

// Start the server to listen on the specified port
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
