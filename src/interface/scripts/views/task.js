import { transform } from "../../scripts/global.js";

export function viewTask() {
    const wrapper = document.querySelector("#wrapper");
    wrapper.className = "task";
    wrapper.dataset.view = location.hash.slice(location.hash.indexOf("-") + 1);

    const page = document.createElement("div");
    page.className = "container";
    page.innerHTML = `
        <div class = "action">
            <div class = "left"><-</div>
            <div class = "center">New Task</div>
            <div class = "right">-></div>
        </div>
        <div class = "content"></div>
        <div class = "action">
            <button class = "bottom" type = "submit" form = "submission" disabled>Submit</button>
        </div>
        <div class = "fill"></div>
        <div class = "footer">
            <a class = "item" href = "/">Main</a>
        </div>
    `;

    load(page);
    
    return page;
}

async function load(page) {
    const id = document.querySelector("#wrapper").dataset.view;

    const content = page.querySelector(".content");
    const action = page.querySelector(".center");
    const submit = page.querySelector(".bottom");

    try {
        const result = await fetch(
            `/api/view?id=${id}`,
            { method: "GET" }
        );

        if (!result.ok) { throw new Error(`HTTP ${result.status}`); }
        const data = await result.json();

        action.addEventListener("click", () => {
            location.hash = `task-${id.slice(0, 7)}-${String(Math.floor(Math.random() * data[id].size) + 1).padStart(3, '0')}`;
        })

        switch (data[id].type) {
            case "choice":
                const { question, options, answer } = data[id].content;
                content.innerHTML = `
                    <form class = "form" id = "submission">
                        <div class = "question">${question}</div>
                        <div class = "options">
                            ${[...options].sort(() => Math.random() - 0.5).map((option) => `
                                <label class = "option">
                                    <input type = "radio" name = "answer" value = "${option}">
                                    <span class = "mark"></span>
                                    <span class = "text">${option}</span>
                                </label>
                            `).join("")}
                        </div>
                    </form>
                `;
                const form = content.querySelector(".form");
                form.addEventListener("change", () => {
                    form.querySelectorAll(".option").forEach((option) => {
                        option.classList.remove("correct", "incorrect");
                    });
                    submit.disabled = false;
                });
                form.addEventListener("submit", (event) => {
                    event.preventDefault();
                    const selected = form.querySelector("input[name = 'answer']:checked");
                    const correct = (selected.value === answer);
                    form.querySelectorAll(".option").forEach((option) => {
                        const input = option.querySelector("input");
                        option.classList.toggle("correct", (input.value === answer));
                        option.classList.toggle("incorrect", (!correct && input.checked));
                    });
                });
                return;

            default:
                content.innerHTML = `
                    Oops! Unknown task type.
                `;

                return;
        }
    } catch (error) {
        page.innerHTML = `Oops! Something wrong.`;
        console.log(error)
    }
}