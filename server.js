


const http = require('http');
const fs = require('fs');
const url = require('url');

// Port for the server
const PORT = 3000;

// File where the data will be stored
const dataFile = './items.json';

// Helper function to read data from JSON file
function readData() {
  return new Promise((resolve, reject) => {
    fs.readFile(dataFile, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve([]); // Return an empty array if file doesn't exist
        } else {
          reject(err);
        }
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

// Helper function to write data to JSON file
function writeData(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Server creation
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;
  
  // Parse the request body data
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    if (path === '/items' && method === 'GET') {
      // GET /items: Retrieve list of items
      try {
        const items = await readData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(items));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read data' }));
      }

    } else if (path === '/items' && method === 'POST') {
      // POST /items: Add a new item
      try {
        const newItem = JSON.parse(body);
        const items = await readData();
        items.push({ ...newItem, id: Date.now() });
        await writeData(items);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Item added successfully' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to add item' }));
      }

    } else if (path.startsWith('/items/') && method === 'PUT') {
      // PUT /items/:id: Update an existing item
      const id = parseInt(path.split('/')[2]);
      try {
        const updatedItem = JSON.parse(body);
        const items = await readData();
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Item not found' }));
        } else {
          items[itemIndex] = { ...items[itemIndex], ...updatedItem };
          await writeData(items);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Item updated successfully' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update item' }));
      }

    } else if (path.startsWith('/items/') && method === 'DELETE') {
      // DELETE /items/:id: Remove an item
      const id = parseInt(path.split('/')[2]);
      try {
        const items = await readData();
        const filteredItems = items.filter(item => item.id !== id);
        await writeData(filteredItems);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Item deleted successfully' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to delete item' }));
      }

    } else {
      // Handle unsupported routes
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Route not found' }));
    }
  });
});

// Start listening on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
