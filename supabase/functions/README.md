## Supabase Edge Functions – API 계약

### 1) upsert_inquiry_step
- Method: POST `/functions/v1/upsert_inquiry_step`
- Body: `{ session_id: string, step: number, payload: object, utm?: object }`
- Response: `{ inquiryId: string, last_step_completed: number }`
- Notes: `session_id` 기준 Row 생성/업데이트. A8/A9 완료 시 알림 트리거 가능

### 2) finalize_inquiry
- Method: POST `/functions/v1/finalize_inquiry`
- Body: `{ session_id: string }`
- Response: `{ inquiryId: string, status: 'awaiting_reply' }`

### 3) admin_update_status (auth required) [TODO]
- Method: POST `/functions/v1/admin_update_status`
- Body: `{ inquiry_id: string, status: 'in_progress'|'awaiting_reply'|'completed'|'archived' }`
- Response: `{ ok: true }`

### 4) admin_assign_agent (auth required) [TODO]
- Method: POST `/functions/v1/admin_assign_agent`
- Body: `{ inquiry_id: string, assignee: string }`
- Response: `{ ok: true }`

### 5) send_notifications (internal helper)
- Email(SendGrid) + Slack Webhook 호출 래퍼

보안: 퍼블릭 사용자는 Functions만 호출. 서비스 롤 키는 Functions 시크릿으로만 보관.

