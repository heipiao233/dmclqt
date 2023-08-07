import { QGridLayout, QPushButton, QTextBrowser } from "@nodegui/nodegui";
import { ChildProcess } from "child_process";
import { Tab } from "../tabs";

export default class LogTab extends Tab {
    constructor(process: ChildProcess, masks: string[]) {
        super();
        let layout = new QGridLayout();
        this.setLayout(layout);
        const text = new QTextBrowser();
        text.setReadOnly(true);
        process.stdout!
            .on("data", (data: string) => {
                for (const i of masks) {
                    data = data.replaceAll(i, "<MASKED>");
                }
                text.append(`<pre>${data}</pre>`);
            });

        process.stderr!
            .on("data", (data: string) => {
                for (const i of masks) {
                    data = data.replaceAll(i, "<MASKED>");
                }

                text.append(`<pre style="color: red;">${data}</pre>`);
            });
        layout.addWidget(text);

        const killButton = new QPushButton();
        killButton.setText("强制结束");
        killButton.addEventListener("clicked", () => process.kill());
        layout.addWidget(killButton, 1);
    }
}
