// Load hosts and events data
Promise.all([
  fetch("assets/data/hosts.json").then((res) => res.json()),
  fetch("assets/data/events.json").then((res) => res.json())
]).then(([hostsData, events]) => {
  const eventList = document.getElementById("event-list");
  eventList.innerHTML = ""; // Clear existing content

  // Sort the events into upcoming and past
  const sortedEvents = sortEvents(events);

  let isPastEvents = false;

  sortedEvents.forEach((event) => {
    const hostImages = event.hosts.map((hostName) => {
      const matchingHost = hostsData.find((host) => host.name === hostName);
      // Use matchingHost.image if found, otherwise use a default image path
      return matchingHost ? `<img src="${matchingHost.image}" alt="${hostName}" class="host-image"">` : `<img src="/not-found.webp" alt="Default Host" class="host-image">`;
    });

    // Check if the event is past and we haven't added the "Past Events" header yet
    const eventDate = new Date(event.date);
    if (eventDate < new Date() && !isPastEvents) {
      // Add the "Past Events" header before past events
      const pastEventsHeader = document.createElement("h2");
      pastEventsHeader.textContent = "Past Events";
      eventList.appendChild(pastEventsHeader);
      isPastEvents = true; // Set flag to true after adding the header
    }

    // Create event list item
    const eventItem = document.createElement("li");
    eventItem.className = "event-card";

    eventItem.innerHTML = `
      <div class="host-images">
        ${hostImages.join("")}
      </div>
      <div class="event-info">
        <strong class="event-title">${event.title}</strong>
        📅 ${new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}<br> 
        ⏰ ${event["start-time"]} - ${event["end-time"]}<br>
        <p>📍 <em>${event.location}</em></p>
        <a href="${event.link}" class="event-link" target="_blank">More Info</a>
      </div>
    `;
    eventList.appendChild(eventItem);
  });
}).catch((error) => {
  console.error("Error loading data:", error);
  const eventList = document.getElementById("event-list");
  eventList.innerHTML = "<p>Unable to load events at this time. Please try again later.</p>";
});

// Function to sort events into upcoming and past
function sortEvents(events) {
  const now = new Date(); // Current date and time

  // Split events into upcoming and past
  const upcoming = [];
  const past = [];

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    if (eventDate >= now) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  });

  // Sort upcoming events by date (earliest first)
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Sort past events by date (most recent first)
  past.sort((a, b) => new Date(b.date) - new Date(a.date));

  return [...upcoming, ...past]; // Combine the sorted lists (upcoming first, then past)
}