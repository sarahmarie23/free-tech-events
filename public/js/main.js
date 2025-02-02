// Load hosts and events data
Promise.all([
  fetch("/assets/data/hosts.json").then((res) => res.json()),
  fetch("/assets/data/events.json").then((res) => res.json())
]).then(([hostsData, events]) => {
  console.log("Hosts Data:", hostsData);
  console.log("Events Data:", events);
  const eventList = document.getElementById("event-list");
  eventList.innerHTML = ""; // Clear existing content

  const { thisWeekEvents, nextWeekEvents, futureEvents, pastEvents } = sortEvents(events);

  // Display "This Week" events
  if (thisWeekEvents.length > 0) {
    const thisWeekHeader = document.createElement("h2");
    thisWeekHeader.textContent = `This Week (${formatWeekRange(0)})`;
    eventList.appendChild(thisWeekHeader);

    thisWeekEvents.forEach(event => {
      createAndAppendEventItem(event, hostsData, eventList);
    });
  }

  // Display "Next Week" events
  if (nextWeekEvents.length > 0) {
    const nextWeekHeader = document.createElement("h2");
    nextWeekHeader.textContent = `Next Week (${formatWeekRange(1)})`;
    eventList.appendChild(nextWeekHeader);

    nextWeekEvents.forEach(event => {
      createAndAppendEventItem(event, hostsData, eventList);
    });
  }

  // Display Future Events
  if (futureEvents.length > 0) {
    const header = document.createElement("h2");
    header.textContent = `Future Events`;
    eventList.appendChild(header);
    futureEvents.forEach(event => {createAndAppendEventItem(event, hostsData, eventList);});
  }

  // Header to separate upcoming and past events
  //const pastEventsHeader = document.createElement("h2");
  //pastEventsHeader.textContent = "Past Events";
  //eventList.appendChild(pastEventsHeader);

  // Display past events
  if (pastEvents.length > 0) {
    const header = document.createElement("h2");
    header.textContent = `Past Events`;
    eventList.appendChild(header);
    pastEvents.forEach(event => createAndAppendEventItem(event, hostsData, eventList));
  }
  
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

  const startOfThisWeek = getStartOfWeek(now);
  startOfThisWeek.setHours(0, 0, 0, 0);

  // Calculate the end of this week (Sunday at 23:59)
  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
  endOfThisWeek.setHours(23, 59, 59, 999);

  // Calculate the start of next week (Monday of next week)
  const startOfNextWeek = new Date(startOfThisWeek);
  startOfNextWeek.setDate(startOfThisWeek.getDate() + 7);
  
  // Calculate the end of next week (Sunday at 23:59)
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
  endOfNextWeek.setHours(23, 59, 59, 999);

  const thisWeekEvents = [];
  const nextWeekEvents = [];
  const futureEvents = [];
  const pastEvents = [];

  events.forEach(event => {
    const eventStart = new Date(event["start-time"]);
    const eventEnd = new Date(event["end-time"]);

    if (eventStart >= startOfThisWeek && eventStart <= endOfThisWeek) {
      // Event is this week
      if (eventEnd < now) {
        // If the event ended before now, it should be in past events
        pastEvents.push(event);
      } else {
        // Otherwise, it's an ongoing or upcoming event this week
        thisWeekEvents.push(event);
      }
    } else if (eventStart >= startOfNextWeek && eventStart <= endOfNextWeek) {
      // Event is next week
      nextWeekEvents.push(event);
    } else if (eventStart > endOfNextWeek) {
      // Event is in the future (after next week)
      futureEvents.push(event);
    } else {
      // Event is in the past
      pastEvents.push(event);
    }
  });

  // Sort events within each group
  thisWeekEvents.sort((a, b) => new Date(a["start-time"]) - new Date(b["start-time"]));
  nextWeekEvents.sort((a, b) => new Date(a["start-time"]) - new Date(b["start-time"]));
  futureEvents.sort((a, b) => new Date(a["start-time"]) - new Date(b["start-time"]));
  pastEvents.sort((a, b) => new Date(b["start-time"]) - new Date(a["start-time"]));

  return { thisWeekEvents, nextWeekEvents, futureEvents, pastEvents };
}

// Helper to get the start of the week (Sunday)
function getStartOfWeek(date) {
  const pacificTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const start = new Date(pacificTime);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = (day === 0 ? -6 : 1) - day; // Shift Sunday (-6) to Monday (1)
  start.setDate(start.getDate() + diff); 
  return start;
}

// Helper to format week range (e.g., "Jan 20–26")
function formatWeekRange(weekOffset) {
  const now = new Date();
  const startOfThisWeek = getStartOfWeek(now);
  const startOfTargetWeek = new Date(startOfThisWeek);
  startOfTargetWeek.setDate(startOfTargetWeek.getDate() + 7 * weekOffset);

  const endOfTargetWeek = new Date(startOfTargetWeek);
  endOfTargetWeek.setDate(endOfTargetWeek.getDate() + 6);

  const options = { month: "short", day: "numeric" };
  const start = startOfTargetWeek.toLocaleDateString("en-US", options);
  const end = endOfTargetWeek.toLocaleDateString("en-US", options);

  return `${start}–${end}`;
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