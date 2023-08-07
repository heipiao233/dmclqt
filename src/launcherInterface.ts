import { ButtonRole, QDialog, QGridLayout, QInputDialog, QLabel, QLineEdit, QMessageBox, QPushButton } from "@nodegui/nodegui";
import { LauncherInterface } from "dmclc/lib/launcher";

class LauncherInterfaceImpl implements LauncherInterface {
    askUser<T extends string>(questions: Record<T, string>, message?: string | undefined): Promise<Record<T, string>> {
        const form = new QDialog();
        const layout = new QGridLayout();
        form.setLayout(layout);
        if (message != undefined) {
            const label = new QLabel();
            label.setText(message);
            layout.addWidget(label, 0, 0, 1, 2);
        }
        let i = 1;
        for (const k in questions) {
            const input = new QLineEdit(form);
            input.setPlaceholderText(questions[k]);
            input.setObjectName(k)
            layout.addWidget(input, i++, 0, 1, 2);
        }
        const ok = new QPushButton(form);
        ok.setText("确认");
        layout.addWidget(ok, i, 0);
        const fail = new QPushButton(form);
        fail.setText("取消");
        layout.addWidget(fail, i, 1);
        form.show();
        return new Promise((resolve, reject) => {
            ok.addEventListener("clicked", () => {
                form.close();
                const t: Record<string, string> = {};
                for (const i of form.children()) {
                    if (i instanceof QLineEdit) {
                        t[i.objectName()] = i.text();
                    }
                }
                resolve(t);
            });

            fail.addEventListener("clicked", () => {
                form.close();
                reject();
            });
        });
    }
    askUserOne(localized: string, message?: string | undefined): Promise<string> {
        const form = new QInputDialog();
        if (message) form.setLabelText(message);
        form.setWindowTitle(localized);
        form.show();
        return new Promise((resolve, reject) => {
            form.addEventListener("accepted", () => {
                resolve(form.textValue());
            });

            form.addEventListener("rejected", () => reject());
        });
    }
    info(message: string, title = "提示"): Promise<void> {
        const box = new QMessageBox();
        const accept = new QPushButton();
        accept.setText('好');
        box.addButton(accept, ButtonRole.AcceptRole);
        box.setText(message);
        box.setWindowTitle(title);
        box.show();
        return new Promise((resolve) => accept.addEventListener("clicked", () => resolve()));
    }

    warn(message: string, title = "警告"): Promise<void> {
        const box = new QMessageBox();
        const accept = new QPushButton();
        accept.setText('好');
        box.addButton(accept, ButtonRole.AcceptRole);
        box.setText(message);
        box.setWindowTitle(title);
        box.show();
        return new Promise((resolve) => accept.addEventListener("clicked", () => resolve()));
    }

    error(message: string, title = "错误"): Promise<void> {
        const box = new QMessageBox();
        const accept = new QPushButton();
        accept.setText('好');
        box.addButton(accept, ButtonRole.AcceptRole);
        box.setText(message);
        box.setWindowTitle(title);
        box.show();
        return new Promise((resolve) => accept.addEventListener("clicked", () => resolve()));
    }

}

export default new LauncherInterfaceImpl();
