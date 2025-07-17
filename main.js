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

const dateRangeTemplate = ({ dateRange }) =>
  html`<h2>${formatDate(dateRange.from)} → ${formatDate(dateRange.to)}</h2>`;

const hourTableTemplate = ({ name, hours }) =>
  hours &&
  html`<table>
    <thead>
      <tr>
        <th>${name}</th>
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
  </table>`;

const app = document.getElementById("app");
const form = document.getElementById("form");
const apiKey = document.getElementById("api-key");

apiKey.value = localStorage.getItem("apiKey");

const dateRange = getCurrentWeekRange();

render(hourTableTemplate({ weekRange: dateRange }), app);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Store api-key
  localStorage.setItem("apiKey", apiKey.value);

  // Fetch data
  const url = new URL("https://denkwerk.mocoapp.com/api/v1/activities");
  url.searchParams.set("from", formatDate(dateRange.from));
  url.searchParams.set("to", formatDate(dateRange.to));
  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Token token=${apiKey.value}`,
      },
    });
    const json = await response.json();

    const customerHours = json.reduce((map, entry) => {
      if (!map[entry.customer.name]) {
        map[entry.customer.name] = 0;
      }
      map[entry.customer.name] += entry.hours;
      return map;
    }, {});

    const projectHours = json.reduce((map, entry) => {
      if (!map[entry.project.name]) {
        map[entry.project.name] = 0;
      }
      map[entry.project.name] += entry.hours;
      return map;
    }, {});

    // Render output
    render(
      html`${dateRangeTemplate({ dateRange })}
        <div class="row">
          ${hourTableTemplate({
            name: "Customer",
            hours: customerHours,
          })}
          ${hourTableTemplate({
            name: "Project",
            hours: projectHours,
          })}
        </div>`,
      app
    );
  } catch (err) {
    console.log(err);
    render(errorTemplate({ error: "Sorry, error fetch data" }), app);
    return;
  }
});
