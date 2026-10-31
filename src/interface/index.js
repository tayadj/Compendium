import { viewMain } from "./scripts/views/main.js";
import { viewUnit } from "./scripts/views/unit.js";
import { viewLesson } from "./scripts/views/lesson.js";
import { viewTask } from "./scripts/views/task.js";



const wrapper = document.querySelector("#wrapper");

const routes = [
    { pattern: /^$/, view: viewMain },
    { pattern: /^#unit-\d{3}-\d{3}-\d{3}$/, view: viewUnit },
    { pattern: /^#lesson-\d{3}-\d{3}-\d{3}$/, view: viewLesson },
    { pattern: /^#task-\d{3}-\d{3}-\d{3}$/, view: viewTask }
];

function render() {
    const path = location.hash;
    const route = routes.find(({ pattern }) => pattern.test(path));

    wrapper.innerHTML = "";
    wrapper.append(route.view());
}

render();
window.addEventListener("hashchange", render);