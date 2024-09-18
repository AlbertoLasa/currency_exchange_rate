# Currency Conversion API

A Node.js application that provides a currency conversion API using exchange rates from the European Central Bank (ECB). It supports multiple currencies, caching, and handles errors effectively for reliable conversions.

## Features

- **Real-time Exchange Rates**: Fetches updated rates from the ECB.
- **Multiple Currencies**: Supports conversion between various currencies.
- **Caching**: Caches data to reduce requests and improve performance.
- **Error Handling**: Retries failed requests and uses cached data if necessary.
- **European Date Format**: Dates are formatted as `DD/MM/YYYY`.

## Requirements

- **Node.js**: Version 18 or higher.
- **npm**: Node Package Manager.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/currency-conversion-api.git
   cd currency-conversion-api

2. Install dependencies:
   ```bash
   npm install

## Usage

1. Start the server:
   ```bash
   node index.js

2. Example request:
   ```bash
   http://localhost:3000/convert?from_currency=USD&to_currency=EUR,GBP&amount=100

### Query Parameters

The API accepts the following query parameters for currency conversion:

| Parameter       | Required | Description                                                                                   | Example Value |
|-----------------|----------|-----------------------------------------------------------------------------------------------|---------------|
| `from_currency` | No       | The code of the source currency. If not provided, `'USD'` will be used by default.             | `USD`         |
| `to_currency`   | No       | The code(s) of the target currency/currencies, separated by commas. If not provided, the API will return conversions for all supported currencies. | `EUR,GBP`     |
| `amount`        | No       | The amount to convert. If not provided, `1` will be used by default.                           | `100`         |


## Supported Currencies

| Currency Code | Currency Name           |
|---------------|-------------------------|
| USD           | United States Dollar    |
| JPY           | Japanese Yen            |
| BGN           | Bulgarian Lev           |
| CZK           | Czech Koruna            |
| DKK           | Danish Krone            |
| GBP           | British Pound Sterling  |
| HUF           | Hungarian Forint        |
| PLN           | Polish Zloty            |
| RON           | Romanian Leu            |
| SEK           | Swedish Krona           |
| CHF           | Swiss Franc             |
| ISK           | Icelandic Krona         |
| NOK           | Norwegian Krone         |
| TRY           | Turkish Lira            |
| AUD           | Australian Dollar       |
| BRL           | Brazilian Real          |
| CAD           | Canadian Dollar         |
| CNY           | Chinese Yuan Renminbi   |
| HKD           | Hong Kong Dollar        |
| IDR           | Indonesian Rupiah       |
| ILS           | Israeli New Shekel      |
| INR           | Indian Rupee            |
| KRW           | South Korean Won        |
| MXN           | Mexican Peso            |
| MYR           | Malaysian Ringgit       |
| NZD           | New Zealand Dollar      |
| PHP           | Philippine Peso         |
| SGD           | Singapore Dollar        |
| THB           | Thai Baht               |
| ZAR           | South African Rand      |
| EUR           | Euro                    |

## License

This project is licensed under the MIT License.
