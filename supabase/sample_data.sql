-- Sample data for shopping mall
-- 카테고리 샘플 데이터

INSERT INTO product_categories (id, name, slug, description, sort_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', '단체복', 'uniforms', '학교, 회사, 동아리를 위한 단체복', 1, true),
('550e8400-e29b-41d4-a716-446655440002', '티셔츠', 'tshirts', '기본 티셔츠 및 맞춤 티셔츠', 2, true),
('550e8400-e29b-41d4-a716-446655440003', '후드/맨투맨', 'hoodies', '후드티와 맨투맨 스웨트셔츠', 3, true),
('550e8400-e29b-41d4-a716-446655440004', '굿즈', 'goods', '커스텀 굿즈 및 기념품', 4, true),
('550e8400-e29b-41d4-a716-446655440005', '액세서리', 'accessories', '모자, 가방, 기타 액세서리', 5, true)
ON CONFLICT (id) DO NOTHING;

-- 상품 샘플 데이터
INSERT INTO products (id, name, slug, description, short_description, base_price, sale_price, stock_quantity, category_id, is_active, is_featured, sort_order) VALUES
('650e8400-e29b-41d4-a716-446655440001', '기본 면 티셔츠', 'basic-cotton-tshirt', '100% 순면으로 제작된 기본 티셔츠입니다. 부드러운 촉감과 우수한 통기성으로 일상 착용에 최적화되어 있습니다.', '편안한 착용감의 기본 면 티셔츠', 15000, 12000, 50, '550e8400-e29b-41d4-a716-446655440002', true, true, 1),
('650e8400-e29b-41d4-a716-446655440002', '프리미엄 후드티', 'premium-hoodie', '고급 소재로 제작된 프리미엄 후드티입니다. 따뜻함과 스타일을 동시에 만족시키는 아이템입니다.', '스타일과 따뜻함을 겸비한 후드티', 45000, null, 30, '550e8400-e29b-41d4-a716-446655440003', true, true, 2),
('650e8400-e29b-41d4-a716-446655440003', '단체복 폴로셔츠', 'polo-shirt-uniform', '단체복용으로 최적화된 폴로셔츠입니다. 깔끔한 디자인과 내구성이 뛰어납니다.', '단체복용 폴로셔츠', 25000, 22000, 100, '550e8400-e29b-41d4-a716-446655440001', true, false, 3),
('650e8400-e29b-41d4-a716-446655440004', '맞춤 에코백', 'custom-eco-bag', '친환경 소재로 제작된 맞춤 에코백입니다. 로고나 문구 인쇄가 가능합니다.', '친환경 맞춤 에코백', 8000, null, 200, '550e8400-e29b-41d4-a716-446655440004', true, false, 4),
('650e8400-e29b-41d4-a716-446655440005', '볼캡 모자', 'baseball-cap', '조절 가능한 볼캡 모자입니다. 자수나 실크스크린 인쇄가 가능합니다.', '조절 가능한 볼캡 모자', 18000, 15000, 75, '550e8400-e29b-41d4-a716-446655440005', true, true, 5)
ON CONFLICT (id) DO NOTHING;

-- 상품 옵션 샘플 데이터 (사이즈)
INSERT INTO product_options (id, product_id, type, name, value, price_modifier, stock_quantity, sort_order, is_active) VALUES
-- 기본 면 티셔츠 사이즈
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'size', 'S', 's', 0, 15, 1, true),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'size', 'M', 'm', 0, 20, 2, true),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'size', 'L', 'l', 0, 10, 3, true),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', 'size', 'XL', 'xl', 1000, 5, 4, true)
ON CONFLICT (id) DO NOTHING;
-- 프리미엄 후드티 사이즈
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', 'size', 'S', 's', 0, 10, 1, true),
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', 'size', 'M', 'm', 0, 15, 2, true),
('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440002', 'size', 'L', 'l', 0, 5, 3, true),
-- 볼캡 모자 사이즈
('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440005', 'size', 'FREE', 'free', 0, 75, 1, true);

-- 상품 옵션 샘플 데이터 (색상)
INSERT INTO product_options (id, product_id, type, name, value, price_modifier, stock_quantity, sort_order, is_active, color_hex) VALUES
-- 기본 면 티셔츠 색상
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'color', '화이트', 'white', 0, 30, 1, true, '#FFFFFF'),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'color', '블랙', 'black', 0, 15, 2, true, '#000000'),
('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'color', '네이비', 'navy', 0, 5, 3, true, '#000080')
ON CONFLICT (id) DO NOTHING;
-- 프리미엄 후드티 색상
('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'color', '그레이', 'gray', 0, 20, 1, true, '#808080'),
('850e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', 'color', '블랙', 'black', 0, 10, 2, true, '#000000'),
-- 볼캡 모자 색상
('850e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440005', 'color', '블랙', 'black', 0, 30, 1, true, '#000000'),
('850e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440005', 'color', '네이비', 'navy', 0, 25, 2, true, '#000080'),
('850e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440005', 'color', '화이트', 'white', 0, 20, 3, true, '#FFFFFF');

-- 상품 이미지 샘플 데이터 (URL은 임시)
INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES
('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'https://via.placeholder.com/400x400/FFFFFF/000000?text=Basic+T-Shirt', '기본 면 티셔츠 메인 이미지', 1, true),
('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'https://via.placeholder.com/400x400/808080/FFFFFF?text=Premium+Hoodie', '프리미엄 후드티 메인 이미지', 1, true),
('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'https://via.placeholder.com/400x400/000080/FFFFFF?text=Polo+Shirt', '단체복 폴로셔츠 메인 이미지', 1, true),
('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 'https://via.placeholder.com/400x400/008000/FFFFFF?text=Eco+Bag', '맞춤 에코백 메인 이미지', 1, true),
('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', 'https://via.placeholder.com/400x400/000000/FFFFFF?text=Baseball+Cap', '볼캡 모자 메인 이미지', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 상품 콘텐츠 샘플 데이터
INSERT INTO product_content (id, product_id, section_type, title, content, sort_order, is_active) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'top', '상품 특징', '<ul><li>100% 순면 소재</li><li>부드러운 촉감</li><li>우수한 통기성</li><li>일상 착용에 최적</li></ul>', 1, true),
('a50e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'middle', '사이즈 가이드', '<table><tr><th>사이즈</th><th>가슴둘레</th><th>어깨너비</th><th>총장</th></tr><tr><td>S</td><td>96cm</td><td>42cm</td><td>66cm</td></tr><tr><td>M</td><td>100cm</td><td>44cm</td><td>68cm</td></tr><tr><td>L</td><td>104cm</td><td>46cm</td><td>70cm</td></tr><tr><td>XL</td><td>108cm</td><td>48cm</td><td>72cm</td></tr></table>', 2, true),
('a50e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'top', '프리미엄 소재', '<p>고급 면-폴리에스터 혼방 소재로 제작되어 보온성과 내구성이 뛰어납니다.</p>', 1, true),
('a50e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 'top', '친환경 인증', '<p>GOTS 인증을 받은 친환경 소재로 제작된 에코백입니다.</p>', 1, true)
ON CONFLICT (id) DO NOTHING;