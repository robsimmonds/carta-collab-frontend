import * as React from "react";
import { Button, Classes, Dialog, FormGroup,InputGroup } from "@blueprintjs/core";
import { observer } from "mobx-react";

import { AppStore, DialogId, DialogStore } from "stores";

export const CloneWorkspaceDialogComponent = observer(() => {
    const appStore = AppStore.Instance;
    const dialogStore = DialogStore.Instance;
    const isOpen = dialogStore.dialogVisible.get(DialogId.CloneWorkspace);
    const workspace = appStore.activeWorkspace;

    const handleClose = () => {
        dialogStore.hideDialog(DialogId.CloneWorkspace);
    };

    const handleClone = async () => {
        if (workspace) {
            await appStore.cloneWorkspace(workspace.name);
        }
        handleClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            title="Clone Workspace"
            canEscapeKeyClose
            canOutsideClickClose
            className={Classes.DIALOG}
        >
            <div className={Classes.DIALOG_BODY}>
                <FormGroup label="Workspace Name">
                    <InputGroup value={workspace?.name || ""} readOnly />
                </FormGroup>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button intent="primary" onClick={handleClone} disabled={!workspace}>Clone</Button>
                </div>
            </div>
        </Dialog>
    );
}); 