import { html, render } from "https://esm.run/lit-html@1";

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatHours(hours) {
  const minutes = ((hours % 1) * 60).toString();
  return `${Math.floor(hours / 1)}:${
    minutes.length == 1 ? `0${minutes}` : minutes
  }`;
}

function getCurrentWeekRange() {
  const currentDate = new Date();
  const currentDay = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + daysToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    from: monday,
    to: sunday,
  };
}

const errorTemplate = ({ error }) => html`<p class="danger">${error}</p>`;

const tableTemplate = ({ weekRange, hours }) =>
  html` <h2>${formatDate(weekRange.from)} → ${formatDate(weekRange.to)}</h2>
    ${hours &&
    html`<table>
      <thead>
        <tr>
          <th>Project</th>
          <th>Hours</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(hours).map((key) => {
          return html`<tr>
            <td>${key}</td>
            <td>${formatHours(hours[key])}</td>
          </tr>`;
        })}
      </tbody>
    </table>`}`;

const app = document.getElementById("app");
const form = document.getElementById("form");
const apiKey = document.getElementById("api-key");

apiKey.value = localStorage.getItem("apiKey");

const weekRange = getCurrentWeekRange();

render(tableTemplate({ weekRange }), app);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Store api-key
  localStorage.setItem("apiKey", apiKey.value);

  // Fetch data
  const url = new URL("https://denkwerk.mocoapp.com/api/v1/activities");
  url.searchParams.set("from", formatDate(weekRange.from));
  url.searchParams.set("to", formatDate(weekRange.to));
  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Token token=${apiKey.value}`,
      },
    });
    const json = await response.json();

    const hours = json.reduce((map, entry) => {
      if (!map[entry.project.name]) {
        map[entry.project.name] = 0;
      }
      map[entry.project.name] += entry.hours;
      return map;
    }, {});

    // Render output
    render(tableTemplate({ weekRange, hours }), app);
  } catch (err) {
    render(errorTemplate({ error: "Sorry, error fetch data" }), app);
    return;
  }
});
