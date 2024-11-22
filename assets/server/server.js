const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from the 'public' folder (JS, CSS, and images)
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Serve static files from the 'assets' directory (like images or JSON files)
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

app.get('/events', (req, res) => {
  const events = readEventsFromFile();  // Fetch the events when requested
  res.json(events);  // Send the events back as JSON
});

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Function to read events from events.json
function readEventsFromFile() {
  const eventsPath = path.join(__dirname,  '..', 'data', 'events.json');
  const data = fs.readFileSync(eventsPath, 'utf8');
  return JSON.parse(data); // This will return the events as a JavaScript object
}

// Endpoint to handle POST requests and update events.json
app.post('/add-event', (req, res) => {
  const newEvent = req.body;

  // Read the existing events.json file
  fs.readFile(path.join(__dirname, '..', 'data', 'events.json'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read events file' });
    }

    let events = JSON.parse(data);
    events.push(newEvent); // Add the new event to the array

    // Write the updated events back to the file
    fs.writeFile(path.join(__dirname, '..', 'data', 'events.json'), JSON.stringify(events, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Unable to save events file' });
      }
      res.status(200).json({ message: 'Event added successfully' });
    });
  });
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
