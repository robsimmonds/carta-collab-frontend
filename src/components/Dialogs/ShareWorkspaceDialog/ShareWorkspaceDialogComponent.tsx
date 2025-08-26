import {ReactNode, useEffect, useState} from "react";
import {AnchorButton, Checkbox, Classes, Dialog, DialogProps, InputGroup, Intent, Menu, MenuItem,Tag,Tooltip} from "@blueprintjs/core";
import {observer} from "mobx-react";

import {AppStore, DialogId} from "stores";

import {AppToaster, WarningToast} from "../../Shared";

import "./ShareWorkspaceDialogComponent.scss";

export const ShareWorkspaceDialogComponent = observer(() => {
    // Remove shareKey and isGeneratingLink state
    // const [shareKey, setShareKey] = useState<string>("");
    // const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
    const [saveBeforeShare, setSaveBeforeShare] = useState<boolean>(false);
    const [shareWith, setShareWith] = useState<string>("");
    const appStore = AppStore.Instance;
    const [role, setRole] = useState<"editor" | "viewer">("viewer");
    

    // Reset the dialog when the active workspace changes
    let shareWorkspaceDialogVisible = appStore.dialogStore.dialogVisible.get(DialogId.ShareWorkspace);
    useEffect(() => {
        // setShareKey("");
        // setIsGeneratingLink(false);
        setSaveBeforeShare(false);
        setShareWith("");
    }, [appStore.activeWorkspace, shareWorkspaceDialogVisible]);

    const {activeWorkspace} = appStore;

    const userList = Array.isArray(activeWorkspace?.users) ? activeWorkspace.users : [];
    const roleList = Array.isArray(activeWorkspace?.roles) ? activeWorkspace.roles : [];

    // Determine if current user is owner
    const isOwner = activeWorkspace?.role.toLowerCase() === "owner";
    const u_name = activeWorkspace?.user;

    // Only allow sharing if user is owner or editor
    const canShare = activeWorkspace?.role && ["owner", "editor"].includes(activeWorkspace.role.toLowerCase());


    const dialogProps: DialogProps = {
        icon: "share",
        className: "share-workspace-dialog",
        canOutsideClickClose: true,
        lazy: true,
        canEscapeKeyClose: true,
        isOpen: shareWorkspaceDialogVisible,
        onClose: () => appStore.dialogStore.hideDialog(DialogId.ShareWorkspace),
        title: `Share Workspace: ${activeWorkspace?.name ?? ""}`
    };

    const handleGenerateClicked = async () => {
        if (!activeWorkspace?.id) return;
        // setIsGeneratingLink(true);
        try {
            if (activeWorkspace.name && saveBeforeShare) {
                await appStore.saveWorkspace(activeWorkspace.name);
            }
            // const shareKey = await appStore.apiService.getSharedWorkspaceKey(activeWorkspace.id, shareWith);
            // setShareKey(shareKey);
            // Instead, just call the share logic (e.g., add user to workspace)
            await appStore.apiService.getSharedWorkspaceKey(activeWorkspace.id, shareWith, role);
            AppToaster.show({ message: `Workspace shared with ${shareWith} as ${role}`, intent: Intent.SUCCESS });

            // Refresh the workspace data so the UI updates immediately
            if (activeWorkspace.name) {
                const refreshedWorkspace = await appStore.apiService.getWorkspace(activeWorkspace.name);
                if (refreshedWorkspace) {
                    appStore.activeWorkspace = { ...appStore.activeWorkspace, ...refreshedWorkspace };
                }
            }
            setShareWith(""); // Clear input after sharing
        } catch (err) {
            console.log(err);
            AppToaster.show(WarningToast("Could not share workspace."));
        }
    };

    // Handler to change a user's role (calls backend)
    const handleChangeRole = async (username: string, newRole: "editor" | "viewer") => {
        AppToaster.show({ message: `Changing role for ${username} to ${newRole}`, intent: Intent.SUCCESS });
        console.log(`Changing role for ${username} to ${newRole}`);
        if (!activeWorkspace?.id) return;
        try {
            const success = await appStore.apiService.changeUserRole(activeWorkspace.id, username, newRole);
            if (success) {
                AppToaster.show({ message: `User ${username} role changed to ${newRole}`, intent: Intent.SUCCESS });
                // Refresh the workspace data by fetching it again
                if (activeWorkspace.name) {
                    const refreshedWorkspace = await appStore.apiService.getWorkspace(activeWorkspace.name);
                    if (refreshedWorkspace) {
                        // Update the active workspace with the new data
                        appStore.activeWorkspace = {...appStore.activeWorkspace, ...refreshedWorkspace};
                    }
                }
            } else {
                AppToaster.show(WarningToast(`Failed to change ${username}'s role`));
            }
        } catch (err) {
            console.log(err);
            AppToaster.show(WarningToast(`Failed to change ${username}'s role`));
        }
    };

    const handleRemoveUser = async (username: string) => {
        if (!activeWorkspace?.id) return;
        try {
            const success = await appStore.apiService.removeUserFromWorkspace(activeWorkspace.id, username);
            if (success) {
                AppToaster.show({ message: `User ${username} removed`, intent: Intent.SUCCESS });
                // Refresh workspace data
                if (activeWorkspace.name) {
                    const refreshedWorkspace = await appStore.apiService.getWorkspace(activeWorkspace.name);
                    if (refreshedWorkspace) {
                        appStore.activeWorkspace = { ...appStore.activeWorkspace, ...refreshedWorkspace };
                    }
                }
            } else {
                AppToaster.show(WarningToast(`Failed to remove ${username}`));
            }
        } catch (err) {
            console.log(err);
            AppToaster.show(WarningToast(`Failed to remove ${username}`));
        }
    };

    let footer: ReactNode;

    // Remove shareKey logic from footer
    // if (shareKey) {
    //     const baseUrl = window.location.href.split("?")[0];
    //     const link = `${baseUrl}?key=${shareKey}`;
    //     const copyButton = <AnchorButton intent={Intent.SUCCESS} minimal={true} icon="clipboard" onClick={() => copyToClipboard(link)} />;
    //     footer = <InputGroup fill={true} intent={Intent.SUCCESS} readOnly={true} defaultValue={link} rightElement={copyButton} />;
    // } else {
    const isReadOnly = !activeWorkspace?.editable || !activeWorkspace.name;
    const saveCheckbox = <Checkbox label="Save workspace before sharing" disabled={isReadOnly} checked={saveBeforeShare} onChange={() => setSaveBeforeShare(!saveBeforeShare)} />;
    const readOnlyTooltip = (
        <span>
            Workspace is not editable
            <br />
            <i>
                <small>You will need to save as a new workspace before sharing to preserve changes</small>
            </i>
        </span>
    );
    footer = (
        <>
            {isReadOnly ? (
                <Tooltip usePortal={false} content={readOnlyTooltip}>
                    {saveCheckbox}
                </Tooltip>
            ) : (
                saveCheckbox
            )}
            {canShare && (
                <AnchorButton intent={Intent.PRIMARY} text="Share" onClick={handleGenerateClicked} />
            )}
        </>
    );
    // }

    return (
        <Dialog {...dialogProps}>
            <div className={Classes.DIALOG_BODY}>
                <p>
                    This workspace will be marked as shared. Please note that this does not automatically grant other users access to files in the workplace. Please contact your system administrator
                    to adjust file permissions. 
                </p>
                 {/*<div>
                   <pre>
                        {JSON.stringify({userList, roleList, username: u_name, isOwner}, null, 2)}
                    </pre>
                </div>*/} 
                {/* Show current users and roles */}
                <div style={{ marginBottom: 12 }}>  
                    <b>Current users:</b>
                    {userList.length === 0 && <span>No users added yet.</span>}
                    {userList.map((username, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", margin: "2px 0" }}>
                            <Tag style={{ marginRight: 8 }}>
                                {username}
                                <span style={{ fontStyle: "italic", marginLeft: 4 }}>
                                    ({roleList[idx] ?? "unknown"})
                                </span>
                            </Tag>
                            {/* Use MenuButton instead of Popover/cog */}
                            {isOwner && username !== u_name && (
                                <>
                                    <Menu>
                                        <MenuItem
                                            text="Change to Editor"
                                            icon="edit"
                                            onClick={() => handleChangeRole(username, "editor")}
                                            disabled={roleList[idx] === "editor"}
                                        />
                                        <MenuItem
                                            text="Change to Viewer"
                                            icon="eye-open"
                                            onClick={() => handleChangeRole(username, "viewer")}
                                            disabled={roleList[idx] === "viewer"}
                                        />
                                    </Menu>
                                    <AnchorButton
                                        icon="delete"
                                        intent={Intent.DANGER}
                                        minimal
                                        style={{ marginLeft: 8 }}
                                        onClick={() => handleRemoveUser(username)}
                                        title="Remove user"
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </div>
                
                
                <InputGroup
                    placeholder="Enter username to share with"
                    value={shareWith}
                    onChange={e => setShareWith(e.target.value)}
                    className="share-username-input"
                    disabled={!canShare}
                />
                <div style={{ margin: "10px 0" }}>
                    <label style={{ marginRight: 8 }}>Role:</label>
                    <select value={role} onChange={e => setRole(e.target.value as "editor" | "viewer")} disabled={!canShare}>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>{footer}</div>
            </div>
        </Dialog>
    );
});
