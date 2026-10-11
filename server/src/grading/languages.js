// Judge0 language ids and per-run limits for the four launch languages.
// memoryKb is an address-space limit (not real RAM): Docker Desktop uses cgroup v2, so Judge0 runs
// without cgroups (see infra/judge0.conf). Node and the JVM reserve a lot of virtual memory,
// so they need much higher values than Python/C++. Found by testing, see README.
export const LANGUAGES = {
  python:     { judge0Id: 71, label: "Python 3.8",  memoryKb: 256000 },
  javascript: { judge0Id: 63, label: "Node 12",     memoryKb: 1000000 },
  java:       { judge0Id: 62, label: "Java 13",     memoryKb: 4000000 },
  cpp:        { judge0Id: 54, label: "C++ (GCC 9)", memoryKb: 256000 },
};
export const CPU_TIME_LIMIT_SEC = 5;
