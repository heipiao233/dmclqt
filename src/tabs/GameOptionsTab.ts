import { Direction, QBoxLayout, QCheckBox, QLineEdit, QPushButton } from "@nodegui/nodegui";
import { Launcher, getJavaVersion } from "dmclc";
import { MinecraftVersion } from "dmclc/lib/version";
import { Tab, addTabAndSwitch } from "../tabs";
import ModListTab from "./ModListTab";
import ContentTab from "./contents";
import LoadersTab from "./loaders";
import SelectJavaTab from "./selectjava";

export class GameOptionsTab extends Tab {
    enableIndependentGameDir = new QCheckBox();
    beforeCommand = new QLineEdit();
    usingJava = new QPushButton();
    moreGameArguments = new QLineEdit();
    moreJavaArguments = new QLineEdit();
    save = new QPushButton();
    modList = new QPushButton();
    contentsButton = new QPushButton();
    loaderButton = new QPushButton();
    constructor(private version: MinecraftVersion, launcher: Launcher) {
        super();
        const layout = new QBoxLayout(Direction.TopToBottom);

        this.usingJava.setText("默认");
        this.usingJava.addEventListener("clicked", () => addTabAndSwitch(new SelectJavaTab(version.extras, true), "选择 Java"));
        layout.addWidget(this.usingJava);

        this.enableIndependentGameDir.setText("开启版本隔离");
        this.enableIndependentGameDir.setChecked(version.extras.enableIndependentGameDir);
        layout.addWidget(this.enableIndependentGameDir);

        this.beforeCommand.setPlaceholderText("运行前命令");
        version.extras.beforeCommand ? this.beforeCommand.setText(version.extras.beforeCommand) : 0;
        layout.addWidget(this.beforeCommand);

        this.moreGameArguments.setPlaceholderText("自定义游戏参数");
        version.extras.moreGameArguments ? this.moreGameArguments.setText(version.extras.moreGameArguments.join(" ")) : 0;
        layout.addWidget(this.moreGameArguments);

        this.moreJavaArguments.setPlaceholderText("自定义游戏参数");
        version.extras.moreJavaArguments ? this.moreJavaArguments.setText(version.extras.moreJavaArguments.join(" ")) : 0;
        layout.addWidget(this.moreJavaArguments);

        this.save.setText("保存");
        this.save.addEventListener("clicked", () => this.saveExtra());
        layout.addWidget(this.save);

        const bottomLayout = new QBoxLayout(Direction.LeftToRight);

        this.modList.setText("模组列表");
        this.modList.addEventListener("clicked", async () => {
            addTabAndSwitch(new ModListTab(version, launcher), `模组列表 - ${version.name}`);
        });
        bottomLayout.addWidget(this.modList);

        this.contentsButton.setText("内容");
        this.contentsButton.addEventListener("clicked", async () => {
            addTabAndSwitch(new ContentTab(launcher, version), `内容 - ${version.name}`);
        });
        bottomLayout.addWidget(this.contentsButton);

        this.loaderButton.setText("安装加载器");
        this.loaderButton.addEventListener("clicked", async () => {
            addTabAndSwitch(new LoadersTab(launcher, version), `安装加载器 - ${version.name}`);
        });
        bottomLayout.addWidget(this.loaderButton);

        layout.addLayout(bottomLayout);
        this.setLayout(layout);
    }

    saveExtra(): void {
        this.version.extras.enableIndependentGameDir = this.enableIndependentGameDir.isChecked();
        this.version.extras.beforeCommand = this.beforeCommand.text();
        this.version.extras.moreGameArguments = parse(this.moreGameArguments.text());
        this.version.extras.moreJavaArguments = parse(this.moreJavaArguments.text());
        this.version.saveExtras();
    }

    async onSelected() {
        if (this.version.extras.usingJava) {
            this.usingJava.setText(await getJavaVersion(this.version.extras.usingJava));
        } else {
            this.usingJava.setText("默认");
        }

        this.modList.setDisabled(this.version.extras.loaders.length == 0);
    }
}

function parse(text: string): string[] {
    if (text === "") return [];
    const result = [];
    const part = [];
    let isStr = 0;
    for(const i of text) {
        switch (i) {
            case '"':
                if (isStr == 1) isStr = 0;
                else if (isStr == 0) isStr = 1;
                result.push(i);
                break;
            case "'":
                if (isStr == 2) isStr = 0;
                else if (isStr == 0) isStr = 2;
                result.push(i);
                break;

            case ' ':
                if (!isStr) {
                    result.push(part.join(""));
                    part.splice(0, part.length);
                    break;
                }

            default:
                part.push(i);
                break;
        }
    }
    result.push(part.join(""));
    return result;
}
