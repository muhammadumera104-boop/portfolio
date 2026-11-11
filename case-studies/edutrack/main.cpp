// EduTrack: a console academic management system.
//
//   edutrack            interactive menu (records are kept in edutrack.dat)
//   edutrack --demo     runs a short scripted session so you can see everything without typing
#include <iostream>

#include "registry.hpp"

using namespace edutrack;

namespace {

const char* DATA_FILE = "edutrack.dat";

std::string ask(const std::string& label) {
    std::cout << label << ": ";
    std::string line;
    if (!std::getline(std::cin, line)) throw std::runtime_error("Input ended.");
    return line;
}

void printAll(const Registry& registry) {
    if (registry.people().empty()) {
        std::cout << "  (no records yet)\n";
        return;
    }
    // One loop for both kinds of person: summary() is virtual, so each class prints itself.
    for (const auto& person : registry.people()) std::cout << "  " << person->summary() << '\n';
}

void printTranscript(const Student& student) {
    std::cout << "  " << student.id() << "  " << student.name() << '\n';
    for (const Result& r : student.results()) {
        std::cout << "    " << std::left << std::setw(8) << r.code << std::setw(4) << r.credits << std::setw(8) << std::defaultfloat << r.marks << "GP "
                  << std::fixed << std::setprecision(2) << gradePoints(r.marks) << '\n';
    }
    std::cout << "    GPA " << std::fixed << std::setprecision(2) << student.gpa() << '\n';
}

// ---- the scripted demo --------------------------------------------------------------------------

// Runs one step and prints what the user would see, including the error message when the input is rejected.
template <typename Step>
void attempt(const std::string& what, Step step) {
    std::cout << "> " << what << '\n';
    try {
        step();
        std::cout << "  ok\n";
    } catch (const std::exception& error) {
        std::cout << "  rejected: " << error.what() << '\n';
    }
}

int runDemo() {
    Registry registry;
    std::cout << "EduTrack demo\n=============\n";
    attempt("add student S-1001 Ayesha Khan", [&] { registry.add(std::make_unique<Student>("S-1001", "Ayesha Khan")); });
    attempt("add student S-1002 Bilal Ahmed", [&] { registry.add(std::make_unique<Student>("S-1002", "Bilal Ahmed")); });
    attempt("add faculty F-2001 Dr. Sana Malik (Computer Science)", [&] { registry.add(std::make_unique<Faculty>("F-2001", "Dr. Sana Malik", "Computer Science")); });
    attempt("add student with a bad id: 1003 Hira", [&] { registry.add(std::make_unique<Student>("1003", "Hira")); });
    attempt("add student S-1001 again", [&] { registry.add(std::make_unique<Student>("S-1001", "Someone Else")); });

    Student* ayesha = registry.findStudent("S-1001");
    attempt("S-1001: CS101, 3 credits, 88.5 marks", [&] { ayesha->addResult("CS101", 3, 88.5); });
    attempt("S-1001: MA101, 3 credits, 72 marks", [&] { ayesha->addResult("MA101", 3, 72); });
    attempt("S-1001: PH101, 4 credits, 64 marks", [&] { ayesha->addResult("PH101", 4, 64); });
    attempt("S-1001: CS101 again", [&] { ayesha->addResult("CS101", 3, 90); });
    attempt("S-1001: CS102 with marks 140", [&] { ayesha->addResult("CS102", 3, 140); });
    attempt("F-2001 teaches CS101", [&] { registry.findFaculty("F-2001")->teach("CS101"); });

    std::cout << "\nAll records (Student and Faculty printed by the same loop):\n";
    printAll(registry);
    std::cout << "\nTranscript:\n";
    printTranscript(*ayesha);

    registry.save("demo.dat");
    std::cout << "\nSaved to demo.dat. Loading it back into a fresh registry...\n";
    Registry again;
    const LoadReport report = again.load("demo.dat");
    std::cout << "  loaded " << report.loaded << " record(s), " << report.problems.size() << " problem(s)\n";
    printAll(again);
    return 0;
}

// ---- the interactive menu -----------------------------------------------------------------------

void menu() {
    Registry registry;
    try {
        const LoadReport report = registry.load(DATA_FILE);
        std::cout << "Loaded " << report.loaded << " record(s) from " << DATA_FILE << ".\n";
        for (const std::string& problem : report.problems) std::cout << "  skipped " << problem << '\n';
    } catch (const std::exception&) {
        std::cout << "Starting with an empty registry.\n";
    }

    while (true) {
        std::cout << "\n1) Add student  2) Add faculty  3) Add result  4) List all  5) Transcript  6) Save  0) Quit\n";
        try {
            const std::string choice = trim(ask("Choose"));
            if (choice == "0") return;
            if (choice == "1") {
                const std::string id = ask("Student id (S-1234)");
                registry.add(std::make_unique<Student>(id, ask("Name")));
            } else if (choice == "2") {
                const std::string id = ask("Faculty id (F-1234)");
                const std::string name = ask("Name");
                registry.add(std::make_unique<Faculty>(id, name, ask("Department")));
            } else if (choice == "3") {
                Student* student = registry.findStudent(trim(ask("Student id")));
                if (!student) throw ValidationError("No such student.");
                const std::string code = ask("Course code (CS101)");
                const int credits = std::stoi(ask("Credit hours"));
                student->addResult(code, credits, std::stod(ask("Marks (0-100)")));
            } else if (choice == "4") {
                printAll(registry);
            } else if (choice == "5") {
                Student* student = registry.findStudent(trim(ask("Student id")));
                if (!student) throw ValidationError("No such student.");
                printTranscript(*student);
            } else if (choice == "6") {
                registry.save(DATA_FILE);
                std::cout << "Saved.\n";
            } else {
                std::cout << "Please choose a number from the menu.\n";
            }
        } catch (const std::invalid_argument&) {
            std::cout << "Please type a number.\n";  // std::stoi / std::stod on text such as "abc"
        } catch (const std::exception& error) {
            std::cout << "Error: " << error.what() << '\n';
            if (std::cin.eof()) return;
        }
    }
}

}  // namespace

int main(int argc, char** argv) {
    if (argc > 1 && std::string(argv[1]) == "--demo") return runDemo();
    menu();
    return 0;
}
