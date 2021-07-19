import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DryRunPreviewPage } from './dry-run-preview.page';

describe('DryRunPreviewPage', () => {
  let component: DryRunPreviewPage;
  let fixture: ComponentFixture<DryRunPreviewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DryRunPreviewPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DryRunPreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
