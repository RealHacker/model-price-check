# Model Atlas Price Lookup

A lightweight, no-database web application for looking up model token prices on Ali Bailian and Ucloud.

The project includes:

- A polished browser interface for searching model prices.
- A TypeScript server that serves the static frontend.
- A server-side UCloud and Bailian API proxy.
- SHA1 request signing according to the algorithm documented in /docs.
- Configuration file storage for the UCloud and Bailian API keys.

## Requirements

- Node.js 18 or newer
- npm
- A UCloud API public/private key pair
- A Bailian API Key

Node.js 18 or newer is recommended because the server uses the native `fetch` API.

## Project structure

```text
price-lookup/
├── docs           # UCloud and Bailian API and signature documentation
├── app.js         # Browser application logic
├── index.html     # Static page
├── package.json   # npm scripts and dependencies
├── server.ts      # Static server and UCloud API proxy
├── styles.css     # Application styles
└── README.md      # Project documentation
```

## Installation

From the project directory:

```bash
cd price-lookup
npm install
```

## Running the application

Start the development server:

```bash
npm run dev
```

Or use the start script:

```bash
npm start
```

The application will be available at:

```text
http://localhost:8787
```

You can change the port with the `PORT` environment variable:

```bash
PORT=9000 npm run dev
```

On Windows PowerShell:

```powershell
$env:PORT=9000
npm run dev
```

## Configure UCloud credentials

Open **API settings** in the application and enter:

- **Public Key** - your UCloud public key.
- **Private Key** - your UCloud private key.
- **BAILIAN API KEY** - your Bailian API key.

When saved, the browser sends these values to the local server through `POST /api/settings`. The server stores them in a conf.json for the current process.

## Using the price lookup

1. Start the server.
2. Open `http://localhost:8787`.
3. Open **API settings**.
4. Enter and save your UCloud and Bailian keys if they haven't been set.
5. Enter a model name, such as `deepseek-r1`.
6. Choose the number of results.
7. Click **Search prices**.

The table displays:

- Model name and ID
- Manufacturer
- Pricing tier and context condition
- Input pricing
- Output pricing
- Currency and billing unit

## API endpoints

### `GET /api/settings`

Returns whether credentials are configured. The public key is returned only in partially masked form.

### `POST /api/settings`

Stores credentials in server memory.

Example request:

```http
POST /api/settings
Content-Type: application/json

{
  "publicKey": "your-public-key",
  "privateKey": "your-private-key"
}
```

### `GET /api/prices`

Requests model prices from UCloud.

Example:

```text
/api/prices?Keyword=deepseek-r1&Offset=0&Limit=20
```

The server adds the UCloud `Action`, `PublicKey`, and `Signature` parameters before forwarding the request.

## Signature generation

The server follows the algorithm described in `API.md`:

1. Build the request parameters.
2. Sort parameter names in ascending order.
3. Concatenate each parameter name and value without HTTP encoding.
4. Append the private key.
5. Hash the resulting UTF-8 string with SHA1.
6. Send the hexadecimal digest as `Signature`.


## Security notes

- Do not commit real UCloud private keys to source control.
- Prefer environment variables or a secret manager in production.
- The current server stores credentials only in process memory; restarting the server clears credentials unless environment variables are configured.
- The settings endpoint is intentionally lightweight and should be protected if the server is exposed beyond a trusted local network.
- The development CORS policy allows all origins. Restrict this policy before deploying publicly.
- Use HTTPS when running outside localhost.

## Licence

This project is licensed under the MIT License.

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
