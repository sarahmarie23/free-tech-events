// Load hosts and events data
Promise.all([
  fetch("assets/data/hosts.json").then((res) => res.json()),
  fetch("assets/data/events.json").then((res) => res.json())
]).then(([hostsData, events]) => {
  const eventList = document.getElementById("event-list");
  eventList.innerHTML = ""; // Clear existing content

  events.forEach((event) => {
      const hostImages = event.hosts.map((hostName) => {
          const matchingHost = hostsData.find((host) => host.name === hostName);
          // Use matchingHost.image if found, otherwise use a default image path
          return matchingHost ? `<img src="${matchingHost.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">` : `<img src="/default-host-image.png" alt="Host Logo" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">`;
      });

      // Create event list item
      const eventItem = document.createElement("li");
      eventItem.innerHTML = `
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${hostImages.join("")}
          </div>
          <strong>${event.title}</strong><br>
          ${new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} 
          ${event["start-time"]} - ${event["end-time"]}<br>
          <em>${event.location}</em><br>
          <a href="${event.link}" target="_blank">More Info</a>
      `;
      eventList.appendChild(eventItem);
  });
}).catch((error) => {
  console.error("Error loading data:", error);
  const eventList = document.getElementById("event-list");
  eventList.innerHTML = "<p>Unable to load events at this time. Please try again later.</p>";
});