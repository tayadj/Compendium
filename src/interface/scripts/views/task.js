import { transform } from "../../scripts/global.js";

export function viewTask() {
    const wrapper = document.querySelector("#wrapper");
    wrapper.className = "task";
    wrapper.dataset.view = location.hash.slice(location.hash.indexOf("-") + 1);

    const page = document.createElement("div");
    page.className = "container";
    page.innerHTML = `
        <div class = "action">
            <button class = "top interactive">Next</button>
        </div>
        <div class = "content"></div>
        <div class = "action">
            <button class = "bottom interactive" type = "submit" disabled>Submit</button>
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
    const next = page.querySelector(".top");
    const submit = page.querySelector(".bottom");

    try {
        const result = await fetch(
            `/api/view?id=${id}`,
            { method: "GET" }
        );

        if (!result.ok) { throw new Error(`HTTP ${result.status}`); }
        const data = await result.json();

        next.addEventListener("click", () => {
            location.hash = `task-${id.slice(0, 7)}-${String(Math.floor(Math.random() * data[id].size) + 1).padStart(3, '0')}`;
        })

        switch (data[id].type) {
            case "choice": {
                const { question, options, answer } = data[id].content;
                content.innerHTML = `
                    <form class = "form" id = "choice">
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
                submit.setAttribute("form", form.id);
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
            }

            case "essay": {
                const { question, answer } = data[id].content;
                content.innerHTML = `
                    <form class = "form" id = "essay">
                        <div class = "question">${question}</div>
                        <textarea class = "input" name = "input" rows = "6" placeholder = "Type your answer..." required></textarea>
                        <div class = "explanation" hidden></div>
                    </form>
                `;
                const form = content.querySelector(".form");
                const input = form.querySelector(".input");
                const explanation = form.querySelector(".explanation");
                submit.setAttribute("form", form.id);
                form.addEventListener("input", () => {
                    input.classList.remove("correct", "incorrect");
                    explanation.hidden = true;
                    submit.disabled = (input.value.trim() === "");
                });
                form.addEventListener("submit", async (event) => {
                    event.preventDefault();
                    const prompt = `
                        Verify the submission.
                        Question: ${question}
                        Ground truth answer: ${answer}
                        User's answer: ${input.value.trim()}
                    `;
                    const schema = `{
                        "name": "submission",
                        "strict": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "correct": { "type": "boolean" },
                                "explanation": { "type": "string" }
                            },
                            "required": ["correct", "explanation"],
                            "additionalProperties": false
                        }
                    }`;
                    const result = await fetch(
                        `/api/parse?prompt=${prompt}&schema=${schema}`,
                        { method: "GET" }
                    );
                    if (!result.ok) { throw new Error(`HTTP ${result.status}`); }
                    const data = JSON.parse(await result.json());
                    input.classList.toggle("correct", data.correct);
                    input.classList.toggle("incorrect", !data.correct);
                    explanation.innerHTML = `
                        ${transform(data.explanation)}
                    `;
                    explanation.hidden = false;
                });
                return;
            }

            case "match": {
                const { question, answer } = data[id].content;
                const entries = Object.entries(answer);
                const keys = [...entries.map(([key]) => key)].sort(() => Math.random() - 0.5);
                const values = [...entries.map(([, value]) => value)].sort(() => Math.random() - 0.5);
                content.innerHTML = `
                    <form class = "form" id = "match">
                        <div class = "question">${question}</div>
                        <div class = "pairs">
                            ${keys.map((key, index) => `
                                <div class = "key" data-key = "${key}">${key}</div>
                                <div class = "value" draggable = "true" data-value = "${values[index]}">${values[index]}</div>
                            `).join("")}
                        </div>
                    </form>
                `;
                const form = content.querySelector(".form");
                submit.setAttribute("form", form.id);
                submit.disabled = false;
                let dragged = null;
                form.addEventListener("dragstart", (event) => {
                    const value = event.target.closest(".value");
                    if (!value) { return; }
                    dragged = value;
                    event.dataTransfer.effectAllowed = "move";
                    value.classList.add("dragging");
                    form.querySelectorAll(".value").forEach((value) => { value.classList.remove("correct", "incorrect"); });
                });
                form.addEventListener("dragend", () => {
                    if (!dragged) { return; }
                    dragged.classList.remove("dragging");
                    dragged = null;
                });
                form.querySelectorAll(".pairs .value").forEach((target) => {
                    target.addEventListener("dragover", (event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                    });
                    target.addEventListener("drop", (event) => {
                        event.preventDefault();
                        if (!dragged || (target === dragged)) { return; }
                        const placeholder = document.createElement("div");
                        target.replaceWith(placeholder);
                        dragged.replaceWith(target);
                        placeholder.replaceWith(dragged);
                        form.querySelectorAll(".value").forEach((value) => { value.classList.remove("correct", "incorrect"); });
                    });
                });
                form.addEventListener("submit", (event) => {
                    event.preventDefault();
                    form.querySelectorAll(".key").forEach((key) => {
                        const value = key.nextElementSibling;
                        const correct = (value.dataset.value === answer[key.dataset.key]);
                        value.classList.toggle("correct", correct);
                        value.classList.toggle("incorrect", !correct);
                    });
                });
                return;
            }

            default: {
                content.innerHTML = `
                    Oops! Unknown task type.
                `;
                return;
            }  
        }
    } catch (error) {
        page.innerHTML = `Oops! Something wrong.`;
        console.log(error)
    }
}