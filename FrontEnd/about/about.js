document.addEventListener('DOMContentLoaded', () => {
    console.log('Phisheye About Page Loaded');

    // --- 3D CUBE INTERACTION ---
    const cube = document.querySelector('.cube');
    const scene = document.querySelector('.scene');

    if (cube) {
        cube.addEventListener('click', () => {
            cube.classList.toggle('grid-view');

            // Optional: Pause animation when in grid view (handled by CSS, but good for logic)
            if (cube.classList.contains('grid-view')) {
                console.log('Cube expanded to grid');
            } else {
                console.log('Cube returned to rotation');
            }
        });
    }

    // --- TEAM MEMBER DATA ---
    const teamData = {
        alex: {
            name: "Shubham Shirgave",
            role: "Cybersecurity Specialist",
            bio: "Shubham has over 10 years of experience in ethical hacking and network security. He leads the threat detection algorithms at Phisheye.",
            email: "shubhamshirgave@gmail.com",
            photo: "https://github.com/Shubh-Shirgave10.png",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/shubham-shirgave-207424300/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "GitHub", url: "https://github.com/Shubh-Shirgave10", iconClass: "fa-brands fa-github" }
            ]
        },
        sarah: {
            name: "Yash Naik",
            role: "Security Analyst",
            bio: "Yash specializes in social engineering patterns and phishing trends. Her research powers our AI's predictive capabilities.",
            email: "yashnaik@gmail.com",
            photo: "https://github.com/yashnaik70.png",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/yash-naik-312888395/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "Github", url: "https://github.com/yashnaik70", iconClass: "fa-brands fa-github" }
            ]
        },
        mike: {
            name: "Mahek Killedar",
            role: "Lead Frontend Dev",
            bio: "Mahek is passionate about creating intuitive and secure user interfaces. He ensures that security doesn't come at the cost of usability.",
            email: "mahekkilledar@gmail.com",
            photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/mahek-killedar-b35654276/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "Github", url: "https://github.com/", iconClass: "fa-brands fa-github" }
            ]
        },
        emily: {
            name: "Pratiksha Patil",
            role: "Full Stack Engineer",
            bio: "Pratiksha architects the scalable infrastructure behind Phisheye. She loves optimizing database queries and API response times.",
            email: "pratikshapatil@gmail.com",
            photo: "../image/image.png",
            socials: [
                { platform: "LinkedIn", url: "https://www.linkedin.com/in/pratiksha-patil-190205300/", iconClass: "fa-brands fa-linkedin-in" },
                { platform: "Github", url: "https://github.com/", iconClass: "fa-brands fa-github" }
            ]
        }
    };

    // --- MODAL LOGIC ---
    const modal = document.getElementById('member-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalName = document.getElementById('modal-name');
    const modalRole = document.getElementById('modal-role');
    const modalBio = document.getElementById('modal-bio');
    const modalEmail = document.getElementById('modal-email');
    const modalPhoto = document.querySelector('.modal-photo');
    const modalSocials = document.getElementById('modal-socials');

    // Open Modal
    document.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('click', () => {
            const memberId = card.getAttribute('data-member');
            const member = teamData[memberId];

            if (member) {
                modalName.textContent = member.name;
                modalRole.textContent = member.role;
                modalBio.textContent = member.bio;
                modalEmail.textContent = `Contact ${member.name.split(' ')[0]}`;
                modalEmail.href = `mailto:${member.email}`;
                modalPhoto.style.backgroundImage = `url('${member.photo}')`;

                // Clear and populate socials with ICONS
                modalSocials.innerHTML = '';
                if (member.socials) {
                    member.socials.forEach(social => {
                        const link = document.createElement('a');
                        link.href = social.url;
                        link.className = 'modal-social-link';
                        link.target = "_blank";

                        // Create Icon Element
                        const icon = document.createElement('i');
                        icon.className = social.iconClass;

                        link.appendChild(icon);
                        modalSocials.appendChild(link);
                    });
                }

                modal.style.display = 'block';
            }
        });
    });

    // Close Modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
