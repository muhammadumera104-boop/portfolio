# EduTrack: academic management in C++17

A console program that keeps student and faculty records, calculates GPA, and saves everything to a text file.
It is a learning project for object-oriented programming, file handling and input validation.

## What it shows

- **Inheritance and polymorphism:** `Person` is an abstract base class; `Student` and `Faculty` override `role()`,
  `summary()` and `serialize()`. One loop prints both kinds.
- **File persistence:** records are saved one per line (`S|S-1001|Ayesha Khan|CS101:3:88.5;MA101:3:72`) and loaded back.
  A damaged line is skipped and reported with its line number instead of crashing the program.
- **Validation:** ids (`S-1234`, `F-1234`), course codes (`CS101`), credit hours (1 to 6) and marks (0 to 100) are checked.
  Bad input throws `ValidationError`; the menu shows the message and asks again.
- **GPA:** marks become grade points on a 4.0 scale and are weighted by credit hours.
- **Safe memory:** people are owned by `std::unique_ptr`, so there is no manual `delete`.

## Build and run

```
g++ -std=c++17 -Wall -Wextra -o edutrack main.cpp
./edutrack --demo      # a scripted session, no typing needed
./edutrack             # interactive menu, records are kept in edutrack.dat

g++ -std=c++17 -Wall -Wextra -o tests tests.cpp
./tests                # 34 checks
```

## Files

| File | What it does |
| --- | --- |
| `models.hpp` | validation helpers, grade points, `Person`, `Student`, `Faculty` |
| `registry.hpp` | owns all people, finds them, saves and loads the data file |
| `main.cpp` | the menu and the `--demo` session |
| `tests.cpp` | tests without a framework |

## Notes

Written as a study project with AI assistance (Claude), then compiled and tested. It is a console program, not a
production system: there are no passwords, no database and no concurrent users.
