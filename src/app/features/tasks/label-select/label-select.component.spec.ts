import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelSelectComponent } from './label-select.component';

describe('LabelSelectComponent', () => {
  let component: LabelSelectComponent;
  let fixture: ComponentFixture<LabelSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabelSelectComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
