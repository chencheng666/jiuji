#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::WebviewWindow;
use tauri_plugin_dialog::DialogExt;
use std::{fs,io::Read};
const LIMIT:usize=2_000_000;
fn local(window:&WebviewWindow)->Result<(),String>{
 let url=window.url().map_err(|e|e.to_string())?;
 let local_origin=(url.scheme()=="tauri"&&url.host_str()==Some("localhost"))||(["http","https"].contains(&url.scheme())&&url.host_str()==Some("tauri.localhost"));
 if window.label()!="main"||!local_origin||url.port().is_some(){return Err("仅本地游戏窗口可使用存档功能".into())}Ok(())
}
fn validate(contents:&str)->Result<(),String>{
 if contents.len()>LIMIT{return Err("存档不能超过 2MB".into())}
 let value:serde_json::Value=serde_json::from_str(contents).map_err(|_|"不是有效JSON")?;
 if !value.is_object(){return Err("存档必须为对象".into())}Ok(())
}
#[tauri::command]
async fn export_save(app:tauri::AppHandle,window:WebviewWindow,contents:String)->Result<bool,String>{
 local(&window)?;validate(&contents)?;
 tauri::async_runtime::spawn_blocking(move||{
  let Some(file)=app.dialog().file().set_file_name("九级-生存存档.json").add_filter("九级存档",&["json"]).blocking_save_file()else{return Ok(false)};
  fs::write(file.into_path().map_err(|e|e.to_string())?,contents).map_err(|e|e.to_string())?;Ok(true)
 }).await.map_err(|e|e.to_string())?
}
#[tauri::command]
async fn import_save(app:tauri::AppHandle,window:WebviewWindow)->Result<Option<String>,String>{
 local(&window)?;
 tauri::async_runtime::spawn_blocking(move||{
  let Some(file)=app.dialog().file().add_filter("九级存档",&["json"]).blocking_pick_file()else{return Ok(None)};
  let file=fs::File::open(file.into_path().map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
  let mut data=String::new();file.take((LIMIT+1)as u64).read_to_string(&mut data).map_err(|e|e.to_string())?;validate(&data)?;Ok(Some(data))
 }).await.map_err(|e|e.to_string())?
}
fn main(){tauri::Builder::default().plugin(tauri_plugin_dialog::init()).invoke_handler(tauri::generate_handler![export_save,import_save]).run(tauri::generate_context!()).expect("九级启动失败");}
#[cfg(test)]mod tests{use super::*;#[test]fn save_requires_bounded_json(){assert!(validate("{}").is_ok());assert!(validate("[]").is_err());assert!(validate(&" ".repeat(LIMIT+1)).is_err());}}
