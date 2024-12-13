// Load hosts and events data
Promise.all([
  fetch("/assets/data/hosts.json").then((res) => res.json()),
  fetch("/assets/data/events.json").then((res) => res.json())
]).then(([hostsData, events]) => {
  console.log("Hosts Data:", hostsData);
  console.log("Events Data:", events);
  const eventList = document.getElementById("event-list");
  eventList.innerHTML = ""; // Clear existing content

  const { upcomingEvents, pastEvents } = sortEvents(events);

  // Display upcoming events
  upcomingEvents.forEach(event => {
    createAndAppendEventItem(event, hostsData, eventList);
  });

  // Header to separate upcoming and past events
  const pastEventsHeader = document.createElement("h2");
  pastEventsHeader.textContent = "Past Events";
  eventList.appendChild(pastEventsHeader);

  // Display past events
  pastEvents.forEach(event => {
    createAndAppendEventItem(event, hostsData, eventList);
  });
  
}).catch((error) => {
  console.error("Error loading data:", error);
  const eventList = document.getElementById("event-list");
  eventList.innerHTML = "<p>Unable to load events at this time. Please try again later.</p>";
});

// Gets called once for upcoming events and then again for past events
function createAndAppendEventItem(event, hostsData, eventList) {
  const hostImages = event.hosts.map((hostName) => {
    const matchingHost = hostsData.find((host) => host.name === hostName);
    return matchingHost ? 
      `<img src="${matchingHost.image}" alt="${hostName}" class="host-image">` : 
      `<img src="/not-found.webp" alt="Default Host" class="host-image">`;
  }).join('');

  const formattedDate = formatEventDate(event["start-time"]);
  const formattedStartTime = parseTime(event["start-time"]);
  const formattedEndTime = parseTime(event["end-time"]);
  const formattedFood = event["food"] == "Yes" ? `✅` : `❌`;

  const eventItem = document.createElement("li");
  eventItem.className = "event-card";

  eventItem.innerHTML = `
  <div class="host-images">
  ${hostImages}
  </div>
  <div class="event-info">
  <strong class="event-title">${event.title}</strong>
  📅 ${formattedDate}<br> 
  ⏰ ${formattedStartTime} - ${formattedEndTime}<br>
  <span class="event-location">📍 <em>${event.location}</em></span>
  🍕 Food: ${formattedFood} 
  <a href="${event.link}" class="event-link" target="_blank">More Info</a>
    </div>
  `;

  eventList.appendChild(eventItem);
}

// Function to sort events into upcoming and past
function sortEvents(events) {
  const now = new Date(); 

  const upcoming = [];
  const past = [];

  events.forEach((event) => {
    const eventStart = new Date(event["start-time"]);
    const eventEnd = new Date(event["end-time"]);

    event.isPast = eventStart < now && eventEnd < now;

    if (eventStart > now || (eventStart <= now && eventEnd >= now)) {
      console.log("Upcoming event: ", event.title);
      upcoming.push(event);
    } else {
      console.log("Past event: ", event.title);
      past.push(event);
    }
  });

  // Sort upcoming events by date (earliest first)
  upcoming.sort((a, b) => new Date(a["start-time"]) - new Date(b["start-time"]));

  // Sort past events by date (most recent first)
  past.sort((a, b) => new Date(b["start-time"]) - new Date(a["start-time"]));

  return { upcomingEvents: upcoming, pastEvents: past }; 
}

function formatEventDate(eventDate) {
  const date = new Date(eventDate);
  const options = { weekday: "long", month: "long", day: "numeric", timeZone: "America/Los_Angeles" };
  
  // Use toLocaleDateString with specified time zone
  return date.toLocaleDateString("en-US", options);
}

function parseTime(isoString) {
  const date = new Date(isoString);
  
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",  
    minute: "2-digit",
    hour12: true,    
    timeZone: "America/Los_Angeles" 
  });
}