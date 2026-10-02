-- Add 'assessment' (เปิดทำแบบประเมิน) to the activity status enum.
-- In this status the public page hides the registration form and shows only
-- the "ทำแบบประเมิน" button.
ALTER TABLE `activities`
  MODIFY `status` ENUM('draft','published','assessment','completed','cancelled')
  NOT NULL DEFAULT 'draft';
