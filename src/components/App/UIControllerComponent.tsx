import * as React from "react";
import {observer} from "mobx-react";

import {HelpDrawerComponent, RootMenuComponent, SplashScreenComponent} from "components";
import {
    AboutDialogComponent,
    BranchWorkspaceDialogComponent,
    CloneWorkspaceDialogComponent,
    CodeSnippetDialogComponent,
    ContourDialogComponent,
    ExternalPageDialogComponent,
    FileBrowserDialogComponent,
    FileInfoDialogComponent,
    FittingDialogComponent,
    LayoutDialogComponent,
    OnlineDataQueryDialogComponent,
    PreferenceDialogComponent,
    RegionDialogComponent,
    SaveWorkspaceDialogComponent,
    ShareWorkspaceDialogComponent,
    StokesDialogComponent,
    TelemetryDialogComponent,
    VectorOverlayDialogComponent,
    WorkspaceDialogComponent} from "components/Dialogs";

@observer
export class UIControllerComponent extends React.Component {
    render() {
        return (
            <React.Fragment>
                <RootMenuComponent />
                <RegionDialogComponent />
                <OnlineDataQueryDialogComponent />
                <ContourDialogComponent />
                <VectorOverlayDialogComponent />
                <FileInfoDialogComponent />
                <FileBrowserDialogComponent />
                <PreferenceDialogComponent />
                <LayoutDialogComponent />
                <WorkspaceDialogComponent />
                <SaveWorkspaceDialogComponent />
                <CloneWorkspaceDialogComponent />
                <BranchWorkspaceDialogComponent />
                <ShareWorkspaceDialogComponent />
                <CodeSnippetDialogComponent />
                <AboutDialogComponent />
                <ExternalPageDialogComponent />
                <HelpDrawerComponent />
                <StokesDialogComponent />
                <TelemetryDialogComponent />
                <SplashScreenComponent />
                <FittingDialogComponent />
            </React.Fragment>
        );
    }
}
