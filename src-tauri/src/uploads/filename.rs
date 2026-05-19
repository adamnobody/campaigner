use std::path::Path;

pub fn sanitize_base_name(name: &str) -> String {
    let stem = Path::new(name)
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or(name);

    let lower = stem.to_lowercase();
    let mut cleaned = String::with_capacity(lower.len());
    let mut previous_dash = false;

    for character in lower.chars() {
        let mapped = if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
            character
        } else {
            '-'
        };

        if mapped == '-' {
            if !previous_dash {
                cleaned.push('-');
                previous_dash = true;
            }
        } else {
            cleaned.push(mapped);
            previous_dash = false;
        }
    }

    let trimmed = cleaned.trim_matches('-');
    let truncated: String = trimmed.chars().take(50).collect();

    if truncated.is_empty() {
        "file".to_string()
    } else {
        truncated
    }
}

pub fn extension_from_name(name: &str) -> String {
    Path::new(name)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| format!(".{}", value.to_lowercase()))
        .unwrap_or_default()
}

fn random_base36(len: usize) -> String {
    const CHARSET: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut out = String::with_capacity(len);
    let mut state = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_nanos() as u64)
        .unwrap_or(0);

    for _ in 0..len {
        state = state.wrapping_mul(1_103_515_245).wrapping_add(12_345);
        let index = (state as usize) % CHARSET.len();
        out.push(CHARSET[index] as char);
    }

    out
}

pub fn unix_ms_timestamp() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

pub fn generate_filename(prefix: &str, original_name: &str) -> String {
    let ext = extension_from_name(original_name);
    let safe_base = sanitize_base_name(original_name);
    let timestamp = unix_ms_timestamp();
    let random = random_base36(6);
    format!("{prefix}-{timestamp}-{random}-{safe_base}{ext}")
}

pub fn generate_map_entity_filename(map_id: i32, original_name: &str) -> String {
    let mut ext = extension_from_name(original_name);
    if ext.is_empty() {
        ext = ".png".to_string();
    }
    let timestamp = unix_ms_timestamp();
    format!("map_{map_id}_{timestamp}{ext}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_matches_expected_rules() {
        assert_eq!(sanitize_base_name("My Photo.PNG"), "my-photo");
        assert_eq!(sanitize_base_name("---"), "file");
    }

    #[test]
    fn generate_filename_has_prefix_and_ext() {
        let name = generate_filename("character", "Avatar.JPG");
        assert!(name.starts_with("character-"));
        assert!(name.ends_with(".jpg"));
    }
}
