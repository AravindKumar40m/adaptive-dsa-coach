// Judge0 language ids and per-run limits for the four launch languages.
// memoryKb is an address-space limit (not real RAM): Docker Desktop uses cgroup v2, so Judge0 runs
// without cgroups (see infra/judge0.conf). Node and the JVM reserve a lot of virtual memory,
// so they need much higher values than Python/C++. Found by testing, see README.
//
// compilerOptions (optional) is passed to Judge0 as `compiler_options`; for Java it ends up in `javac <options> Main.java`.
// "-J" hands a flag to the JVM that runs javac. Without a cap a JVM sizes itself from the machine it sees (heap = a quarter
// of RAM, 1 GB of class space, one GC thread per CPU), which on a big Docker VM can pass the 4,000,000 KB address-space
// limit above: javac then died with "insufficient memory for the Java Runtime Environment" on about 1 compile in 7 (Day 5).
// These flags keep javac's reservation small and the same on every machine. They only shape javac; the learner's program
// still runs on a default JVM (Judge0 gives `java Main` no way to take flags).
const JAVAC_JVM_CAP = "-J-Xmx256m -J-Xss512k -J-XX:+UseSerialGC -J-XX:CompressedClassSpaceSize=64m -J-XX:ReservedCodeCacheSize=64m -J-XX:MaxMetaspaceSize=128m";

export const LANGUAGES = {
  python:     { judge0Id: 71, label: "Python 3.8",  memoryKb: 256000 },
  javascript: { judge0Id: 63, label: "Node 12",     memoryKb: 1000000 },
  java:       { judge0Id: 62, label: "Java 13",     memoryKb: 4000000, compilerOptions: JAVAC_JVM_CAP },
  cpp:        { judge0Id: 54, label: "C++ (GCC 9)", memoryKb: 256000 },
};
export const CPU_TIME_LIMIT_SEC = 5;
