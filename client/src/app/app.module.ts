import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GameSheetComponent } from '@app/components/game-sheet/game-sheet.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { PlayerNameDialogComponent } from '@app/components/player-name-dialog/player-name-dialog.component';
import { ScrollBoxComponent } from '@app/components/scroll-box/scroll-box.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { CreationPageComponent } from '@app/pages/creation-page/creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { AcceptComponent } from './components/accept-pop-up/accept-pop-up.component';
import { ButtonTextPopComponent } from './components/button-text-pop/button-text-pop.component';
import { EndGameComponent } from './components/end-game-pop-up/end-game-pop-up.component';
import { ImageUploadCanvasComponent } from './components/image-upload-canvas/image-upload-canvas.component';
import { SelectionPageComponent } from './pages/selection-page/selection-page.component';
import { GameService } from './services/game.service';
import { RequestHandler } from './services/request-handler.service';
/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        SelectionPageComponent,
        ConfigPageComponent,
        PlayAreaComponent,
        GameSheetComponent,
        ScrollBoxComponent,
        CreationPageComponent,
        ImageUploadCanvasComponent,
        PlayerNameDialogComponent,
        EndGameComponent,
        ButtonTextPopComponent,
        AcceptComponent,
    ],
    imports: [AppMaterialModule, AppRoutingModule, BrowserAnimationsModule, BrowserModule, FormsModule, HttpClientModule, ReactiveFormsModule],
    providers: [RequestHandler],
    bootstrap: [AppComponent, GameService],
})
export class AppModule {}
