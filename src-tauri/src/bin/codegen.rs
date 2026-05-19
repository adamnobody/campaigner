use std::path::PathBuf;

fn main() {
    let output_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../frontend/src/types/generated/bindings.ts");

    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create generated types directory");
    }

    campaigner_tauri::specta::export_bindings(&output_path)
        .expect("Failed to export TypeScript bindings");
}
