use napi::bindgen_prelude::Status;
use napi::threadsafe_function::ThreadsafeFunction;

pub type NapiWeakThreadsafeFunction<T, R> = ThreadsafeFunction<T, R, T, Status, true, true>;
