import * as React from "react";
import { useState } from "react";
import { Button, Classes, Dialog, FormGroup,InputGroup } from "@blueprintjs/core";
import { observer } from "mobx-react";

import { AppStore, DialogId, DialogStore } from "stores";

export const SaveWorkspaceDialogComponent = observer(() => {
    const appStore = AppStore.Instance;
    const dialogStore = DialogStore.Instance;
    const [commitMessage, setCommitMessage] = useState("");
    const isOpen = dialogStore.dialogVisible.get(DialogId.SaveWorkspace);
    const workspace = appStore.activeWorkspace;

    const handleClose = () => {
        dialogStore.hideDialog(DialogId.SaveWorkspace);
        setCommitMessage("");
    };

    const handleSave = async () => {
        if (workspace) {
            await appStore.saveWorkspace(workspace.name, commitMessage);
        }
        handleClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Save Workspace"
            canEscapeKeyClose
            canOutsideClickClose
            className={Classes.DIALOG}
        >
            <div className={Classes.DIALOG_BODY}>
                <FormGroup label="Workspace Name">
                    <div style={{ padding: '8px 0', fontWeight: 500 }}>{workspace?.name || ""}</div>
                </FormGroup>
                <FormGroup label="Commit Message (optional)">
                    <InputGroup
                        value={commitMessage}
                        onChange={e => setCommitMessage(e.currentTarget.value)}
                        placeholder="Enter a commit message"
                    />
                </FormGroup>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button intent="primary" onClick={handleSave} disabled={!workspace}>Save</Button>
                </div>
            </div>
        </Dialog>
    );
}); 