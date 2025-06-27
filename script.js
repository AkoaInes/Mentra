// Example data (simulate backend response)
const teacher = {
  name: "Mr. John Doe",
  course: "Web Development",
  level: "Senior Instructor",
  email: "john@example.com",
  photo: "https://via.placeholder.com/120"
};

// Fill the card
document.getElementById("teacherName").innerText = teacher.name;
document.getElementById("teacherCourse").innerText = teacher.course;
document.getElementById("teacherLevel").innerText = teacher.level;
document.getElementById("teacherEmail").innerText = teacher.email;
document.getElementById("teacherPhoto").src = teacher.photo;

