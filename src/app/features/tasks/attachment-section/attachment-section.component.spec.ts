import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachmentSectionComponent } from './attachment-section.component';

describe('AttachmentSectionComponent', () => {
  let component: AttachmentSectionComponent;
  let fixture: ComponentFixture<AttachmentSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttachmentSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
