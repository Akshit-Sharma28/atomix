INSERT INTO Finding
(id,title,severity,source,status,projectId,createdAt,verified,cvssScore)
VALUES

('find101','SQL Injection','Critical','Manual Pentest','Open','proj_customer',datetime('now'),0,9.8),

('find102','Stored XSS','High','Burp Suite','Open','proj_customer',datetime('now'),0,8.4),

('find103','Broken Access Control','Critical','Manual Pentest','Open','proj_finance',datetime('now'),0,9.6),

('find104','JWT Secret Disclosure','High','Code Review','Open','proj_finance',datetime('now'),0,8.1),

('find105','Rate Limit Bypass','Medium','API Testing','Open','proj_mobile',datetime('now'),0,6.5),

('find106','Sensitive Data Exposure','Critical','Manual Pentest','Open','proj_mobile',datetime('now'),0,9.1),

('find107','Privilege Escalation','High','Manual Pentest','Open','proj_admin',datetime('now'),0,8.7),

('find108','Missing MFA','Medium','Review','Closed','proj_admin',datetime('now'),1,5.3),

('find109','SSRF in PDF Generator','Critical','Manual Pentest','Open','proj_customer',datetime('now'),0,9.4),

('find110','Prompt Injection','High','LLM Pentest','Open','proj_mobile',datetime('now'),0,8.9);