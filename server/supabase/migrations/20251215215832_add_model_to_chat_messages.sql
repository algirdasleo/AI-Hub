-- Add model column to chat_messages table to track which model was used per message
alter table chat_messages add column model text;

-- Add model column to project_messages table as well
alter table project_messages add column model text;
