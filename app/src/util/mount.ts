import {Constants} from "../constants";
import {showMessage} from "../dialog/message";
import {isMobile} from "./functions";
import {fetchPost} from "./fetch";
import {Dialog} from "../dialog";
import {getNotebookName, getOpenNotebookCount} from "./pathName";
import {validateName} from "../editor/rename";
import {setStorageVal} from "../protyle/util/compatibility";

export const newDailyNote = () => {
    const exit = window.siyuan.dialogs.find(item => {
        if (item.element.getAttribute("data-key") === window.siyuan.config.keymap.general.dailyNote.custom) {
            item.destroy();
            return true;
        }
    });
    if (exit) {
        return;
    }
    const openCount = getOpenNotebookCount();
    if (openCount === 0) {
        showMessage(window.siyuan.languages.newFileTip);
        return;
    }
    if (openCount === 1) {
        let notebookId = "";
        window.siyuan.notebooks.find(item => {
            if (!item.closed) {
                notebookId = item.id;
            }
        });
        fetchPost("/api/filetree/createDailyNote", {
            notebook: notebookId,
            app: Constants.SIYUAN_APPID,
        });
        return;
    }
    const localNotebookId = window.siyuan.storage[Constants.LOCAL_DAILYNOTEID];
    if (localNotebookId && getNotebookName(localNotebookId) && !isMobile()) {
        fetchPost("/api/filetree/createDailyNote", {
            notebook: localNotebookId,
            app: Constants.SIYUAN_APPID,
        });
    } else {
        let optionsHTML = "";
        window.siyuan.notebooks.forEach(item => {
            if (!item.closed) {
                optionsHTML += `<option value="${item.id}">${item.name}</option>`;
            }
        });
        const dialog = new Dialog({
            content: `<div class="b3-dialog__content">
    <select class="b3-select fn__block">${optionsHTML}</select>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
</div>`,
            width: isMobile() ? "80vw" : "520px",
        });
        dialog.element.setAttribute("data-key", window.siyuan.config.keymap.general.dailyNote.custom);
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        const selectElement = dialog.element.querySelector(".b3-select") as HTMLSelectElement;
        selectElement.value = localNotebookId;
        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });
        btnsElement[1].addEventListener("click", () => {
            const notebook = selectElement.value;
            window.siyuan.storage[Constants.LOCAL_DAILYNOTEID] = notebook;
            setStorageVal(Constants.LOCAL_DAILYNOTEID, window.siyuan.storage[Constants.LOCAL_DAILYNOTEID]);
            fetchPost("/api/filetree/createDailyNote", {
                notebook,
                app: Constants.SIYUAN_APPID,
            });
            dialog.destroy();
        });
    }
};

export const mountHelp = () => {
    const notebookId = Constants.HELP_PATH[window.siyuan.config.appearance.lang as "zh_CN" | "en_US"];
    fetchPost("/api/notebook/removeNotebook", {notebook: notebookId, callback: Constants.CB_MOUNT_REMOVE}, () => {
        fetchPost("/api/notebook/openNotebook", {
            callback: Constants.CB_MOUNT_HELP,
            notebook: notebookId
        });
        fetchPost("/api/notebook/openNotebook", {
            callback: Constants.CB_MOUNT_HELP, // 根据 .siyuan/conf.json 解析笔记本名和图标
            notebook: Constants.HELP_PATH.zh_CN_Sillot
        });
    });
};

export const newNotebook = () => {
    const dialog = new Dialog({
        title: window.siyuan.languages.newNotebook,
        content: `<div class="b3-dialog__content">
    <input placeholder="${window.siyuan.languages.notebookName}" class="b3-text-field fn__block">
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
</div>`,
        width: isMobile() ? "80vw" : "520px"
    });
    const btnsElement = dialog.element.querySelectorAll(".b3-button");
    dialog.bindInput(dialog.element.querySelector("input"), () => {
        btnsElement[1].dispatchEvent(new CustomEvent("click"));
    });
    btnsElement[0].addEventListener("click", () => {
        dialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
        const name = dialog.element.querySelector("input").value;
        if (!validateName(name)) {
            return false;
        }
        fetchPost("/api/notebook/createNotebook", {
            name
        });
        dialog.destroy();
    });
};
