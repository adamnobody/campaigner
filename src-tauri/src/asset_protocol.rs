use http::{header, StatusCode};
use tauri::{AppHandle, Runtime};

use crate::error::AppError;
use crate::uploads::storage::read_file_bytes;
use crate::uploads::web_path::{content_type_for_path, resolve_disk_path};

fn forbidden_response() -> http::Response<Vec<u8>> {
    http::Response::builder()
        .status(StatusCode::FORBIDDEN)
        .body(Vec::new())
        .unwrap_or_else(|_| {
            http::Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(Vec::new())
                .expect("fallback response")
        })
}

fn not_found_response() -> http::Response<Vec<u8>> {
    http::Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(Vec::new())
        .unwrap_or_else(|_| forbidden_response())
}

fn ok_response(bytes: Vec<u8>, content_type: &str) -> http::Response<Vec<u8>> {
    http::Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CACHE_CONTROL, "private, max-age=3600")
        .body(bytes)
        .unwrap_or_else(|_| forbidden_response())
}

fn extract_uploads_path(uri: &str) -> Option<String> {
    let without_fragment = uri.split('#').next().unwrap_or(uri);
    let without_query = without_fragment
        .split('?')
        .next()
        .unwrap_or(without_fragment);

    if let Some(rest) = without_query.strip_prefix("campaigner://") {
        return Some(format!("/{rest}"));
    }

    if let Some(rest) = without_query.strip_prefix("campaigner:/") {
        return Some(format!("/{rest}"));
    }

    if let Some(rest) = without_query.strip_prefix("http://campaigner.localhost") {
        return Some(rest.to_string());
    }

    if let Some(rest) = without_query.strip_prefix("https://campaigner.localhost") {
        return Some(rest.to_string());
    }

    if let Some(rest) = without_query.strip_prefix("http://campaigner") {
        return Some(rest.to_string());
    }

    None
}

fn handle_request<R: Runtime>(app: &AppHandle<R>, uri: &str) -> http::Response<Vec<u8>> {
    let Some(web_path) = extract_uploads_path(uri) else {
        return forbidden_response();
    };

    if web_path.contains("..") {
        return forbidden_response();
    }

    let disk_path = match resolve_disk_path(app, &web_path) {
        Ok(path) => path,
        Err(AppError::Internal { code, .. }) if code == "ASSET_NOT_FOUND" => {
            return not_found_response();
        }
        Err(_) => return forbidden_response(),
    };

    let bytes = match read_file_bytes(&disk_path) {
        Ok(bytes) => bytes,
        Err(_) => return not_found_response(),
    };

    let content_type = content_type_for_path(&disk_path);
    ok_response(bytes, content_type)
}

pub fn register_campaigner_protocol<R: tauri::Runtime>(
    builder: tauri::Builder<R>,
) -> tauri::Builder<R> {
    builder.register_uri_scheme_protocol("campaigner", |context, request| {
        let uri = request.uri().to_string();
        handle_request(context.app_handle(), uri.as_str())
    })
}
