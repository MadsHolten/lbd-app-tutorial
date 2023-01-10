import { Component, OnDestroy, OnInit } from '@angular/core';
import { ResponseMimetype } from 'async-oxigraph';
import { ParserSettings } from 'ifc-lbd';
import { BimViewerService, ElementData, ICDD, LBDComponentsService, ParsingProgress, PickedObject, ViewerSettings } from 'ngx-lbd-components';
import { getViewerSettings } from './viewer-settings';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  public viewerSettings: ViewerSettings = getViewerSettings();
  public ifcParsingProgress: ParsingProgress = new ParsingProgress(0, 0, 0);
  public loadedElements: ElementData[] = [];

  public icddLoading: boolean = false;
  public icddReady: boolean = false;
  private icdd?: ICDD;

  constructor(
    private readonly lbd: LBDComponentsService,
    private readonly bimViewerService: BimViewerService
  ) { }

  ngOnInit() {
    // Subscribe to elements loaded across all models
    this.bimViewerService.getLoadedElements().subscribe(elements => {
      console.log("New elements loaded");
      // console.log(elements);
      this.loadedElements = elements;
    });
  }

  ngOnDestroy() {
    this.icdd?.close();
    this.icdd = undefined;
  }

  onIFCUpload(ev: any): void {

    this.ifcParsingProgress = new ParsingProgress(0, 0, 0);

    if (ev.target.files.length == 0) {
      console.log("No file selected!");
      return;
    }

    let file: File = ev.target.files[0];

    // Parsing settings
    const settings = new ParserSettings();
    settings.namespace = "https://test/";
    settings.subsets = {
      BOT: true,
      FSO: false,
      PRODUCTS: true,
      PROPERTIES: true
    };

    // Downloads zip when finished
    const parsingProgress$ = this.lbd.parseLBD(file, settings).subscribe(progress => {
      this.ifcParsingProgress = progress;
      if (progress.zipWrite == 100) parsingProgress$.unsubscribe();
    });

  }

  onICDDUpload(ev: any) {

    if (ev.target.files.length == 0) {
      console.log("No file selected!");
      return;
    }
    const file: File = ev.target.files[0];

    // Load ICDD
    this.icdd = new ICDD();
    this.icddLoading = true;
    this.icdd.loadContainer(file).then(() => {
      console.log("ICDD READY!");
      this.icddLoading = false;
      this.icddReady = true;
    }).catch(err => console.log(err));

    // Load model in viewer
    this.bimViewerService.loadModel(file).catch(err => console.log(err));

  }

  async queryICDD() {

    // SELECT QUERY EXAMPLE
    const selectQuery = "PREFIX bot: <https://w3id.org/bot#> SELECT * WHERE { ?s a bot:Space }";
    const selectQueryResult = await this.icdd?.query(selectQuery);
    console.log(selectQueryResult);

    // UPDATE QUERY EXAMPLE
    const updateQuery = `
      PREFIX bot: <https://w3id.org/bot#>
      PREFIX ex: <https://ex#>
      INSERT { ?s a ex:Elephant } 
      WHERE { ?s a bot:Space }`;
    const updateQueryResult = await this.icdd?.query(updateQuery);
    console.log(updateQueryResult);

    // ASK QUERY EXAMPLE
    const elephantsExist = await this.icdd?.query("PREFIX ex: <https://ex#> ASK WHERE {?s a ex:Elephant }");
    console.log(elephantsExist);
    
    // CONSTRUCT QUERY EXAMPLE
    const constructQuery = "PREFIX ex: <https://ex#> CONSTRUCT {?s a ex:Elephant } WHERE {?s a ex:Elephant }";
    const constructQueryResult = await this.icdd?.query(constructQuery, ResponseMimetype.JSONLD);
    console.log(constructQueryResult);

  }

  downloadICDD(){
    this.icdd?.download().catch(err => console.log(err));
  }


  /**
   * MODEL EVENTS
   */
  onSelectionChange(selection: PickedObject[]) {
    console.log(selection);
  }


}
